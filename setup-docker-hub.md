# Setting up Docker Hub Publishing

This guide will help you set up automatic Docker Hub publishing for your GoTo Connect SMS Sender project.

## Prerequisites

1. A Docker Hub account
2. A GitHub repository with the project
3. GitHub Actions enabled on your repository

## Step 1: Create a Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Go to **Account Settings** > **Security**
3. Click **New Access Token**
4. Give it a name (e.g., "GitHub Actions")
5. Copy the token (you won't see it again!)

## Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub access token |

## Step 3: Update the Workflow

The workflow file `.github/workflows/docker-publish.yml` is already configured, but you need to update the image name:

1. Open `.github/workflows/docker-publish.yml`
2. Replace `oneofthegeeks` with your actual Docker Hub username in these lines:
   ```yaml
   images: ${{ secrets.DOCKER_USERNAME }}/goto-sms-sender
   ```

## Step 4: Test the Setup

1. Create a new release on GitHub
2. The workflow will automatically:
   - Build the Docker image
   - Push it to Docker Hub
   - Tag it with the release version

## Step 5: Update Documentation

Update the README.md to replace `oneofthegeeks` with your actual Docker Hub username in:
- Docker pull commands
- Docker run examples
- Installation instructions

## Verification

After a release is published, you should see:
- A new image on Docker Hub: `oneofthegeeks/goto-sms-sender`
- Tags matching your release versions
- The image available for pulling

## Troubleshooting

### Common Issues

1. **Authentication failed**
   - Check your Docker Hub credentials
   - Ensure the access token has the right permissions

2. **Image not found**
   - Verify the image name in the workflow
   - Check that the release was published successfully

3. **Build failed**
   - Check the GitHub Actions logs
   - Ensure all required files are present

### Manual Publishing

If you need to publish manually:

```bash
# Build the image
docker build -t oneofthegeeks/goto-sms-sender:latest .

# Login to Docker Hub
docker login

# Push the image
docker push oneofthegeeks/goto-sms-sender:latest
```

## Security Notes

- Never commit your Docker Hub credentials
- Use access tokens instead of passwords
- Regularly rotate your access tokens
- Monitor your Docker Hub usage

---

Your Docker Hub publishing is now set up! 🐳 