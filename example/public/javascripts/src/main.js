import Vue from 'vue'
import Router from 'vue-router'

import App from './components/App.vue'
import LoginView from './components/LoginView.vue'
import MembersView from './components/MembersView.vue'

// install router & resource
Vue.use(Router)

// routing
var router = new Router()
router.map({
  '/login': {
    component: LoginView
  },
  '/members': {
  	component: MembersView
  }
})

router.beforeEach(function() {
  window.scrollTo(0, 0)
})

router.redirect({
  '*': '/login'
})

router.start(App, 'app')