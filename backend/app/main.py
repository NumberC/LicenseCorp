from fastapi import FastAPI, HTTPException, Request
from redis.asyncio import Redis
import httpx
import os

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    app.state.redis = Redis.from_url(redis_url, decode_responses=True)
    app.state.http_client = httpx.AsyncClient()

@app.on_event("shutdown")
async def shutdown_event():
    await app.state.redis.aclose()
    await app.state.http_client.aclose()

"""
POST /tasks: Add a new task.
○ GET /tasks: Retrieve all tasks.
○ PUT /tasks/{id}: Update an existing task.
○ DELETE /tasks/{id}: Delete a task.
"""

# in database will be {id: [description: string, complete: bool]}

@app.post("/tasks/")
async def add_task(uuid: str = None, description: str = None, complete: bool = False):
    if not uuid or not description:
        return {"error": "UUID and description are required."}

    # add to redis   
    try:
        await app.state.redis.rpush(uuid, description)
        await app.state.redis.rpush(uuid, str(complete).lower())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"uuid": uuid, "description": description, "complete": str(complete).lower()}

@app.get("/tasks/")
async def get_tasks():
    UUIDs = await app.state.redis.keys("*")
    tasks = {}
    for uuid in UUIDs:
        value = await app.state.redis.lrange(uuid, 0, -1)  # Get the list: [text, completed]
        if value and len(value) == 2:
            # Convert string boolean to real boolean
            text = value[0]
            completed = value[1].lower() == "true"
            tasks[uuid] = [text, completed]
    
    return tasks

@app.put("/tasks/{uuid}")
async def update_task(uuid: str, request: Request):
    r = app.state.redis
    exists = await r.exists(uuid)
    if not exists:
        raise HTTPException(status_code=404, detail="No item with this UUID exists.")
        
    # Overwrite both elements in the Redis list
    try:
        body = await request.json()
        description = body.get("description")
        complete = body.get("complete")
        
        if description is None or complete is None:
            raise HTTPException(status_code=400, detail="Description and complete status are required.")

        await r.lset(uuid, 0, description)
        await r.lset(uuid, 1, str(complete).lower())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"id": uuid, "description": description, "complete": complete}

@app.delete("/tasks/{uuid}")
async def delete_task(uuid: str):
    r = app.state.redis
    exists = await r.exists(uuid)
    if not exists:
        raise HTTPException(status_code=404, detail="No item with this UUID exists.")
    
    await r.delete(uuid)

    return {"message": f"Task with id {uuid} has been deleted."}