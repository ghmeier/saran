# Saran

## What's Saran?
A thin, protective coating for MyMLH that'll let you view your MyMLH data and add functionality with minimal code (because most of it's right here).

For [HackISU](http://hackisu.org), I used MyMLH as a primary registrations tool because it's simple, reliable, and has all the fields for a member event. I ran into a problem though, when trying to integrate with other services (like mailchimp), or visualize the data. My life turned into a living hell of downloading an importing csv's.

So, like any hacker, I started writing code to help me out which led to [MyMLH Dashboard](https://github.com/ghmeier/my-mlh-dashboard). That's all fine and good, but WE WANT MORE. So, __saran__ was born to give that little extra bit on top of MyMLH.

So, how does it work??

## Let's Get Started.
To get started, you can deploy to a Heroku dyno:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

*If that's not your style, you'll need a server running node and a mongodb instance*

Then, head on over to [MyMLH](https://my.mlh.io) and register a new application.
![New MyMLH](https://github.com/ghmeier/saran/blob/master/img/new-my-mlh.png)

Now, you need to set two heroku config variables, APP_ID (your MyMLH application id) and secret (your MyMLH application secret).

![Heroku Config](https://github.com/ghmeier/saran/blob/master/img/config-screen.png)

Sweet. Basic config is up. If you open `<app-name>.herokuapp.com`, you should see something like this:
![Running App](https://github.com/ghmeier/saran/blob/master/img/empty%20screen.png)

## Integrate with registration
Saran has a `POST /user` endpoint which will let you create a new user solely from their MyMLH `access_token` (it's a url parameter at the callback you set initially). The following snippet adds the user based on their MyMLH `access_token`:
```javascript
  var data = JSON.stringify({
    token:<my_mlh_access_token>,
  });
  $.ajax({
    type: "POST",
    url: "https://<app-name>.herokuapp.org/user",
    data: data,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function(data){
      //some success action
    }
  });
```
Great! Now you can add users from you hackathon home page. *It's easy to send more data to Saran, just add it to the data object above, and the server will have access to it.*

You have users, now how can you view them?

## Adding User Tokens
I built Saran with the flexibility to allow sponsors to view the dashboard as well as organizers. However, not everyone should be able to see all (or any) of the data. To filter data, we need to create tokens which the back end uses to validate what a client can (and cannot see).

To create a token:
```
POST /token -d {"token":"sharkhacks-admin","permissions":"checked_in,first_name,last_name,email_address,school,phone_number"}
```

Now, you can navigate to `<app-name>.herokuapp.com?token=sharkhacks-admin` and it will fill the columns with `checked_in`, `first_name`, `last_name`, `email_address`, `school`, and `phone_number`. How neat!

## What Next?
Now, you can extend saran to fit your needs, storing additional parameters or integrating with mailchimp (there's sample code in `user-helper.js`), all synced up with your MyMLH registrants.

## Contribution
I quickly mashed together a bunch of my code from two separate apps, so comments, questions, and contributions are appreciated! I'll be responding as quickly as I can, so toss me a pull request.

<3
