<style>

#qrcode {
  height: 256px;
}

.progress {
  margin-top: 20px;
  width: 300px;
}

</style>

<template>

<div class="text-center" id="qrcode" v-el:qr-code>
</div>

<div class="progress center-block">
  <progressbar :now="waitTime" :type=" waitTime > 50 ? 'success' : waitTime > 20 ? 'warning' : 'danger' " striped animated></progressbar>
</div>

<alert :show.sync="loginFail" type="danger" dismissable>
  <span class="icon-info-circled alert-icon-float-left"></span>
  <strong>对不起</strong>
  <p>您超时未登录，请重新登陆</p>
</alert>

</template>

<script>

import service from '../service'
import {
  progressbar, alert
}
from 'vue-strap'

module.exports = {

  name: 'LoginView',

  data() {
    return {
      waitTime: 100,
      loginFail: false
    }
  },

  components: {
    progressbar,
    alert
  },

  methods: {
    alreadyLogin() {
        return service.checkLogin()
      },
      showQR() {
        return service.getUUID().then(uuid => {
          const qrCode = 'https://login.weixin.qq.com/l/' + uuid
          this.$els.qrCode.innerHTML = ''
          new QRCode(this.$els.qrCode, qrCode)
        }).catch(err => {
          alert('生成二维码失败，请重试')
          this.$router.go('/login')
        })
      },
      login() {
        service.loginConfirm().then(result => {
          this.$router.go('/members')
        }).catch(err => {
          this.loginFail = true
          setTimeout(() => {
            this.startLogin()
          }, 2000)
        })
      },
      startLogin() {
        this.loginFail = false

        this.showQR().then(() => {
          this.waitTime = 100
          this.login()
        })

        let countdown = setInterval(() => {
          this.waitTime -= 2
          if (this.waitTime <= 0) {
            clearInterval(countdown);
          }
        }, 500)
      }
  },

  created() {
    this.alreadyLogin().then(() => {
      this.$router.go('/members')
    }).catch(err => {
      this.startLogin()
    })
  }
}

</script>
