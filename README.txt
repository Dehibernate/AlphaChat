Make sure you have Git and NodeJS installed.

Git: https://git-scm.com/downloads
NodeJS: https://nodejs.org/en/download/
Optional: Use a GUI wrapper for Git, like TortoiseGit (Windows) or SourceTree (Mac OS X).

Before running the server, open a bash terminal in the project folder and type: npm install

This project requires a Google Cloud account, which is either active (paid) or in trial mode. The account must have Datastore properly configured as described in the Google documentation: https://cloud.google.com/datastore/docs/datastore-api-tutorial#prerequisites

Make sure you update the configuration of the cloud datastore client in ./storage/dbClient.js with the appropriate projectID and API key, which you must generate by following the instructions provided above.

To run the server, open a bash terminal in this folder (e.g. Git Bash on Windows) and type: node index.js

This runs the Node.js server, which binds to port 3000.

Open a browser and open two tabs at http://localhost:3000 to test out the chat app.

Before deploying the app to GCloud, you need to have Google Cloud SDK installed and initialised with your active Google Cloud account. To deploy the app, you can run the cloud-deploy.bat (or .sh) script in the root folder.