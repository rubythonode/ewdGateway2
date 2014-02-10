// 10 February 2014

EWD.bootstrap3 = {
  createMenu: function() {
    if (typeof EWD.application.menuOptions === 'undefined') return;
    if (document.getElementById('ewd-mainMenu') && !EWD.application.menuCreated) {
      var option;
      var i;
      for (i = 0; i < EWD.application.menuOptions.length; i++) {
        option = EWD.application.menuOptions[i];
        var li = document.createElement('li');
        li.setAttribute('id', 'menu-' + i);
        if (option.active) {
          li.setAttribute('class', 'active ewd-menu');
          EWD.application.activeMenu = 'menu-' + i;
        }
        else {
          li.setAttribute('class', 'ewd-menu');
        }
        var a = document.createElement('a');
        a.setAttribute('href', '#');
        a.innerHTML = option.text;
        li.appendChild(a);
        document.getElementById('ewd-mainMenu').appendChild(li);
      }
      EWD.application.menuCreated = true;
    }
  },

  /* navigation functionality
     * Navbar needs id of 'navList'
     * Navbar buttons need suffix of '[id]_Nav'
     * Footer needs div wrapper with id of '#footerLinks'
     * Footer buttons need suffix of '[id]_Footer'
     * navbar and footer buttons will then switch the current container with '[id]_Container'
     * during animation navbar & footer buttons are disabled
  */
  nav: {
    // swap pages from current to target
    // targetId = string ID of clicked navbar/footer link (e.g. ewd_Nav/ewd_Footer)
    pageSwap: function(targetId) {
      var current = EWD.bootstrap3.nav.getCurrentPage();
      var target = targetId.split('_')[0];
      if (target !== current) {
        var currentRef = '#' + current + '_Container';
        var targetRef = '#' + target + '_Container';        
        $('#' + current + '_Container').on('hidden.bs.collapse', function() {
          $('#' + target + '_Container').on('shown.bs.collapse', function() {
            EWD.bootstrap3.nav.enable();
            $('#' + target + '_Container').unbind();
          });
          $('#' + target + '_Container').collapse('show');
          $('#' + current + '_Container').unbind();
        });
        EWD.bootstrap3.nav.disable();
        $('#' + current + '_Container').collapse('hide');
        $('#' + current + '_Nav').removeClass('active');
        $('#' + target + '_Nav').addClass('active');
      }
      if (typeof EWD.application.navFragments[target] !== 'undefined') {
        var params = EWD.application.navFragments[target];
        if (!params.file) params.file = target + '.html';
        if (!params.targetId) params.targetId = target + '_Container';
        if (!params.fragmentOuterId) params.fragmentOuterId = target + 'PageLoaded';
        var loadFragment = function(params) {
          EWD.sockets.sendMessage({
            type: "EWD.getFragment", 
            params:  {
              file: params.file,
              targetId: params.targetId
            }
          });
        }
        if (params.cache) {
          if ($('#' + params.targetOuterId).length === 0) loadFragment(params);
        }
        else {
          loadFragment(params);
        }
      }
      //if (EWD.application.onPageSwap) EWD.application.onPageSwap(target);
      if (EWD.application.onPageSwap) {
        if (EWD.application.onPageSwap[target]) EWD.application.onPageSwap[target]();
      } 
    },
    // initialise navbar & footer buttons
    enable: function() {
      if ($('#navList')) {
        $('#navList').children().each(function() { // add listener to each navbar button
          $('#' + this.id).on('click', function() {
            EWD.bootstrap3.nav.pageSwap(this.id);
          });
        });
      }
      if ($('#footerLinks')) {
        $('#footerLinks').children().each(function() { // add listener to each footer button
          $('#' + this.id).on('click', function() {
            EWD.bootstrap3.nav.pageSwap(this.id);
          });
        });
      }
    },
    // disable navbar buttons
    disable: function() {
      if ($('#navList')) {
        $('#navList').children().each(function() {
          $('#' + this.id).unbind();
        });
      }
      if ($('#footerLinks')) {
        $('#footerLinks').children().each(function() {
          $('#' + this.id).unbind();
        });
      }
    },
    // find which page container is currently open
    getCurrentPage: function() {
      var current;
      var id;
      $('#navList').children().each(function() {
        id = this.id.split('_')[0];
        if ($('#' + id + '_Container').hasClass('in')) {
          current = this.id.split('_')[0];
        }
      });
      return current;
    }
  }

};

EWD.targetIdExists = function(targetId) {
  if (targetId.charAt(0) !== '#') targetId = '#' + targetId;
  return $(targetId).length !== 0
};

EWD.onSocketsReady = function() {
  EWD.application.topPanelActivated = false;
  EWD.application.menuCreated = false;
  EWD.application.framework = 'bootstrap';

  if (EWD.application.selectPatient) {
    if (document.getElementById('newPatient')) {
      document.getElementById('newPatient').style.display = '';
    }
  }

  if (EWD.application.tabbedPanels) {
    if (document.getElementById('ewd-tabs')) {
      document.getElementById('ewd-tabs').style.display = '';
    }
  }

  for (id in EWD.application.labels) {
    document.getElementById(id).innerHTML = EWD.application.labels[id];
  }
  $('#loginPanel').on('show.bs.modal', function() {
    setTimeout(function() {
      document.getElementById('username').focus();
    },1000);
  });
  $('#loginPanel').modal({show: true, backdrop: 'static'});

  $('#loginPanelBody').keydown(function(event){
    if (event.keyCode === 13) {
      document.getElementById('loginBtn').click();
    }
  });

  $('#newPatient').click(function(e) {
    e.preventDefault();
    $('#patientSelectionForm').modal('show');
    $('#patientSelectionFormBody').css("overflow-y","visible");
    if (EWD.application.topPanelActivated) $('#topPanel').collapse('hide');
  });

  $('#patientSelectionForm').on('hide.bs.modal', function() {
    if (EWD.application.topPanelActivated) {
      $('#topPanel').collapse('show');
    }
  });

  // select2 handler that fires on each keystroke in the Select Patient panel

  $("#selectedPatient").select2({
    minimumInputLength: 1,
    query: function (query) {
      EWD.application.select2 = {
        callback: query.callback,
      };
      EWD.sockets.sendMessage({
        type: 'patientQuery',
        params: {
          prefix: query.term
        }
      });
    }
  });

  // Login form button handler

  $('body').on( 'click', '#loginBtn', function(event) {
    event.preventDefault(); // prevent default bootstrap behavior
    EWD.sockets.submitForm({
      fields: {
        username: $('#username').val(),
        password: $('#password').val()
      },
      messageType: 'EWD.form.login',
      alertTitle: 'Login Error',
      toastr: {
        target: 'loginPanel'
      },
      popover: {
        buttonId: 'loginBtn',
        container: 'loginPanel',
        time: 2000
      }
    }); 
  });

  // Patient Selector Form button handler

  $('body').on( 'click', '#patientBtn', function(event) {
    event.stopPropagation(); // prevent default bootstrap behavior
    EWD.sockets.sendMessage({
      type: 'patientSelected',
      params: {
        patientId: $('#selectedPatient').select2('val')
      }
   });
  });

  // Menu handler

  $('body').on( 'click', '.ewd-menu', function(event) {
    event.stopPropagation();
    var id = event.currentTarget.id;
    $('#' + EWD.application.activeMenu).toggleClass("active", false);
    $('#' + id).toggleClass("active", true);
    EWD.application.activeMenu = id;
    var option = id.split('menu-')[1];
    EWD.application.menuOptions[option].handler();
  });

  if (toastr) {    
    toastr.options = {
      positionClass: "toast-top-right",
      showDuration: 300,
      hideDuration: 300,
      timeOut: 3000,
      showEasing: "linear",
      hideEasing: "swing",
      showMethod: "slideDown",
      hideMethod: "slideUp"
    };
  }
  else {
    $('#loginBtn').popover({
      title: 'Error',
      content: 'Testing',
      placement: 'top',
      container: '#loginPanel',
      trigger: 'manual'
    });
  }

  // everything is ready to go:
  // activate login button and the user can start interacting

  if (EWD.application.onStartup) EWD.application.onStartup();

  document.getElementById('loginBtn').style.display = '';
};

EWD.onSocketMessage = function(messageObj) {

  if (messageObj.type === 'EWD.form.login') {
    // logged in OK - hide login panel
    if (messageObj.ok) $('#loginPanel').modal('hide');
    if (!EWD.application.selectPatient) {
      $('#topPanel').collapse('show');
      EWD.application.topPanelActivated = true;
      EWD.bootstrap3.createMenu();
    }
    return;
  }

  if (messageObj.type === 'loggedInAs') {
    // update 'logged in as ' banner in header
    document.getElementById('ewd-loggedInAs').innerHTML = messageObj.message.fullName;
    return;
  }

  if (messageObj.type === 'patientMatches') {
    // update patient lookup combo with matching names
    EWD.application.select2.results = messageObj.params;
    EWD.application.select2.callback(EWD.application.select2);
    return;
  }

  if (messageObj.type === 'patientSelected') {
    // patient selected: remove combo and show patient panel
    $('#topPanel').collapse('show');
    $('#patientSelectionForm').modal('hide');
    EWD.application.topPanelActivated = true;
    document.getElementById('ewd-panel1-title').innerHTML = messageObj.message.patientName;
    EWD.bootstrap3.createMenu();
    return;
  }

  if (EWD.application.onMessage) {
    if (EWD.application.onMessage[messageObj.type]) EWD.application.onMessage[messageObj.type](messageObj);
  } 

  if (EWD.application.messageHandlers) EWD.application.messageHandlers(messageObj);

};

$(document).ready(function() {
  EWD.isReady();
});



