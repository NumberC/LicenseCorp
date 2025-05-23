## Video Demo: 
https://youtu.be/uftoQO9ZrA0

## Setup and Run:
1. git clone this repo
2. go into the repo directory (`cd LicenseCorp`)
3. `run docker-compose up --build`

Your terminal should look like this:

```
git clone https://github.com/NumberC/LicenseCorp.git
cd ./LicenseCorp/
docker-compose up --build
```

To see the website, go to `http://localhost:3000`

Make sure ports 8000, 3000, and 6379 are free on your computer. If they are not, you will need to adjust the `docker-compose.yml` to readdress them.

## Application architecture.
Both the backend and frontend have their own Dockerfiles running python and node. These are referrenced in the `docker-compose.yml` in the root directory.

`backend/app/main.py` runs the FastAPI

`frontend/src/app/page.tsx` holds the HTML of the website

`frontend/src/app/app.js` has functions that use axios to call the backend. This file acts as the bridge between frontend and backend in a more organized way than putting the calls directly in `page.tsx`

## Explanation of Redis usage.
The `main.py` file stores the ToDo task IDs as keys in redis. The value for these keys is a list that contains their description and completion status. Each REST api call updates, creates, or deletes these values accordingly.

 At the same time, we are publishing these updates, creates, and deletes to a channel called "tasks_changed". The websocket in `main.py` then listens to this channel and alerts the frontend. The frontend reacts by updating the state of the page. Likewise, when the user updates the page, the page sends an API call to the backend which changes the redis data and publishes an event in the channel.