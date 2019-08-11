# Synology Surveillance Station app for Homey
This is an alternative Homey app to connect with a Synology Surveillance Station. It was built because I needed some extra features and did not want to depend on the developer of the Homey community app for Synology Surveillance Station. It will not be published in the Homey App Store but feel free to sideload it with a CLI install if the current app store version does not fit your needs.

## Flow Cards
* [TRIGGER] Motion Detected (requires setting up action in Synology Surveillance Station as described below)
* [CONDITION] Camera is enabled / disabled
* [CONDITION] Camera is / is not recording
* [ACTION] Enable / Disable Surveillance Station Home Mode
* [ACTION] Enable / Disable Camera
* [ACTION] Send snapshot from any camera through email
* [ACTION] Use snapshot from any camera as global image token
* [ACTION] Start / Stop Recording

## Installation
To use this app, you need to supply the IP address of the Synology NAS, as well as a username and password of a manager account with Surveillance Center. It's best to set up a manager purely for this purpose, by following these steps from a computer:

* Login to your Synology
* Click on "Surveillance Station" so it opens in a new window.
* Click on the menu button and select the "User" option.
* Click on "Add", fill in a username and password (remember both, you will be needing them later)
* Click "Next", make sure to choose the profile with "Manager" rights.
* Click "Next", make sure to check all cameras you want to give access to.
* Click "Complete".

After that you can add your Synology Surveillance Center as device within Homey using these credentials. To be able to use the 'Motion Detected' trigger card you will need to do some configuration within Surveillance Center.

* Login to your Synology
* Click on "Surveillance Station" so it opens in a new window.
* Click on the menu button and select the "Action Rule" option. For each camera that you want to use the motion trigger you will need to add a action rule with the following settings:
  * Information Tab: A recognizable name, Activated Profile and Interuptable
  * Event Tab: Camera, Your Selected Camera and Motion Detected as Event
  * Action Tab: External Device with URL http://<<homey_ip>>/api/app/surveillance.station.homey/motion/<<camera_name>> . Replace <<homey_ip>> with the local IP of your Homey and <<camera_name>> with a recognizable name. This will be available as tag in the trigger card so you can identify the camera that triggered the motion detected event.
  * Schedule Tab: fill the whole schedule (or customize it to your needs)
* Save the event rule and repeat this for every camera, making sure you set the correct <<camera_name>> each time in the action URL.

To be able to send snapshots through email you will need to configure an email account which sends out the email. In the general settings of the Surveillance Station App there is a section to configure your email account. Please pay attention to the extra information when adding a Gmail account, this requires you to use a specific app password which needs to be setup within your Google account.

## Changelog
### v1.2.0 - 2019-08-11
* IMPROVEMENT: added device discovery
