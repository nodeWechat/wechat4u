<template>
  <div class="text-center" id="qrcode" v-el:qr-code></div>
</template>

<script>
import service from '../service'

module.exports = {
  data() {
    return {
    }
  },
  methods: {
    alreadyLogin() {
      return service.checkLogin()
    },
  	showQR() {
  		return service.getUUID().then(uuid => {
				const qrCode = 'https://login.weixin.qq.com/l/'  + uuid
				new QRCode(this.$els.qrCode, qrCode);
  		}).catch(err => {
        alert('生成二维码失败，请重试')
        this.$router.go('/login');
      })
  	},
  	login() {
  		service.loginConfirm().then(result => {
  			this.$router.go('/members');
  		}).catch(err => {
  			alert('登陆失败，请重试')
  			this.$router.go('/login');
  		})
  	}
  },
  created() {
    this.alreadyLogin().then(() => {
      this.$router.go('/members');
    }).catch(err => {
      this.showQR().then(()=>{
        this.login()
      })
    })
  }
}
</script>