<template>
  <div>
    <nav class="navbar navbar-default">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="#">联系人列表</a>
      </div>

      <form class="navbar-form navbar-left" role="search">
        <div class="form-group">
          <input type="text" class="form-control" placeholder="查找" v-model="critiria">
        </div>
      </form>

      <p class="navbar-text navbar-left">该版本为内部测试版本，如需退出请点击手机微信中的退出网页版</p>
    </nav>

    <div class="row">
      <member
        v-for="member in showMembers"
        :member="member"
        :index="$index">
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
    critiria () {
      this.showMembers = this.members.filter((member) => {
        return member.nickname.indexOf(this.critiria) > -1
      })
    }
  },

  events: {
    'switch-member': function (index) {
      let member = this.showMembers.splice(index,1)
      this.showMembers.unshift(member[0])
    }
  },

  route: {
    data () {
      this.getMembers().catch(() => {
        alert('请先登录，谢谢！')
        this.$router.go('/login');
      })
    }
  },
}
</script>