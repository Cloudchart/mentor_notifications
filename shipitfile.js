module.exports = function(shipit) {
  require('shipit-deploy')(shipit);
  require('shipit-shared')(shipit);
  require('shipit-npm')(shipit);

  shipit.initConfig({

    default: {
      servers: 'app@mentor1.cochart.net',
      workspace: '/tmp/mentor-notifications-deploy',
      deployTo: '/home/app/mentor-notifications',
      repositoryUrl: 'git@github.com:Cloudchart/mentor_notifications.git',
      keepReleases: 2,
      shallowClone: 'true',
      shared: {
        overwrite: true,
        dirs: ['node_modules'],
        files: ['.env'],
      },
      npm: {
        remote: true,
        installFlags: '--production',
        triggerEvent: 'sharedEnd',
      },
    },

  })

  shipit.on('published', function() {
    return shipit.remote(`cd ${shipit.currentPath} && forever restart mentor-notifications`)
  })

}
