echo "Moving node_modules to avoid interference with gcloud"
mv node_modules ../$$$

cmd.exe /c gcloud preview app deploy

echo "Moving back node_modules"
mv ../$$$ node_modules
pause
