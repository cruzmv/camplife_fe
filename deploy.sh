#!/bin/bash

# Run npm build
echo "Building the project..."
npm run build

# Check if the build was successful
if [ $? -ne 0 ]; then
  echo "Build failed. Exiting."
  exit 1
fi

# Copy the contents of the 'dist' folder to the remote server
echo "Copying the build files to the remote server..."
scp -r ./dist/camplife/browser/* mcruz@cruzmv.ddns.net:/home/mcruz/deploy/fe

# Check if the copy was successful
if [ $? -ne 0 ]; then
  echo "Copy failed. Exiting."
  exit 1
fi

# # SSH into the remote server and copy the build files to the deployment directory
# echo "Copying the build files on the remote server..."
# ssh mcruz@cruzmv.ddns.net "sudo cp -r -S /home/mcruz/deploy/api/dist/* /var/www/camplife/api/dist/"

# # Check if the copy on the remote server was successful
# if [ $? -ne 0 ]; then
#   echo "Remote copy failed. Exiting."
#   exit 1exit

# fi

echo "Deployment completed successfully."
