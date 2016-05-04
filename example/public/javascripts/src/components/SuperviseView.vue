

<template>

<div>
  <nav class="navbar navbar-default">
    <div class="navbar-header">
      <a class="navbar-brand">监督</a>
    </div>

    <form class="navbar-form navbar-left" role="search">
      <div class="form-group">
        <input type="text" class="form-control" placeholder="查找" v-model="critiria">
      </div>
    </form>

    <p class="navbar-text navbar-left">
      该版本为内部测试版本，如需退出请点击手机微信中的退出网页版。点击
      <span class="glyphicon glyphicon-send"></span> 让TA监督我
    </p>
  </nav>

  <div class="row">
    <member v-for="member in showMembers" :member="member" :index="$index">
    </member>
  </div>

</div>

</template>

<script>

import service from '../service'
import Member from './Member.vue'

module.exports = {

  name: 'MembersView',

  components: {
    Member
  },

  data() {
    return {
      members: {},
      showMembers: {},
      critiria: ''
    }
  },

  methods: {
    getMembers() {
      return service.getMembers().then(members => {
        this.showMembers = this.members = members
      })
    }
  },

  watch: {
    critiria() {
      this.showMembers = this.members.filter((member) => {
        return member.nickname.indexOf(this.critiria) > -1
      })
    }
  },

  events: {
    'switch-member': function(index) {
      let member = this.showMembers.splice(index, 1)[0]

      service.switchSupervise(member.username).then(() => {
        member.switch = !member.switch
      })

      this.showMembers.unshift(member)
    }
  },

  route: {
    data() {
      this.getMembers().catch(() => {
        alert('请先登录，谢谢！')
        this.$router.go('/login');
      })
    }
  },
}

</script>
