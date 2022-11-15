#!/snap/bin/pwsh

$mydir = Get-Location
$settingsFile = "src\toxicity-settings.json"

Write-Output "Looking for Amplify..."
$amp = Get-Command amplify -errorAction SilentlyContinue
$npm = Get-Command npm -errorAction SilentlyContinue
if (! $amp) {
    Write-Output "We need to install and configure Amplify..."
    Invoke-WebRequest https://aws-amplify.github.io/amplify-cli/install-win -OutFile install.cmd
    .\install.cmd
    amplify -configure
}
if (! $npm) {
    Write-Output "We need to install Node.js..."
    winget install --accept-package-agreements --accept-source-agreements OpenJS.NodeJS.LTS
    Write-Output "Node.js installed"
}
if (! $amp -or ! $npm) {
    Write-Output "Dependencies are now installed, please re-run this script"
    Exit
}

Write-Output "Amplify and Node installed"

if (-not(Test-Path -Path $settingsFile -PathType Leaf)) {
    Write-Output "Creating settings..."
    $lambdaUrl = Read-Host -Prompt  "Lambda Function URL : " 
    Write-Output "Writing config file : 'src\toxicity-settings.json'"
    "{ `"API_URL`": `"$lambdaUrl`" }"  | Out-File  -Encoding ASCII -FilePath $settingsFile
}

if (-not(Test-Path -Path "amplify")) {

    Write-Output "Installing node packages..."
    npm ci

    Write-Output "Setting up : Amplify"
    Write-Output "Accept all the default options"
    amplify init

    Write-Output "Setting up : Amplify - Auth"
    Write-Output "Accept all the default options : Default Configuration, Username as authentication, no advanced settings"
    amplify add auth

    Write-Output "Setting up : Amplify Hosting"
    Write-Output "Select : Hosting with Amplify Console, and then manual deployment (the defaults)"
    amplify add hosting

    Write-Output "Setting up : Amplify - Predictions - Transcribe"
    Write-Output "Select : Convert -> Transcribe text from audio -> accept name suggestion -> British English -> Auth users only"
    amplify add predictions

    Write-Output "Pushing your applications backend : '${appName}'"
    amplify push
}

Write-Output "Publishing the front end ..."
amplify publish
Write-Output "To run locally, issue : npm start"

