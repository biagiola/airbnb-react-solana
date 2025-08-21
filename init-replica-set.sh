#!/bin/bash

echo "Waiting for MongoDB to start..."
sleep 10

echo "Initializing replica set..."
docker exec airbnb-mongodb mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'localhost:27017' }]
})
"

echo "Waiting for replica set to be ready..."
sleep 5

echo "Replica set initialized successfully!"
