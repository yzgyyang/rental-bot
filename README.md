# RentalBot
A Rental Management Bot made for UWPC.

## Deployment
The following secret values should be set in environmental variables instead of in the code:
`FB_VERIFY_TOKEN`
`FB_ACCESS_TOKEN`

If you are deploying this app using Heroku (like I did), use Heroku CLI to set:
```
heroku config:set FB_VERIFY_TOKEN=your_verify_token
heroku config:set FB_ACCESS_TOKEN=your_access_token
```
