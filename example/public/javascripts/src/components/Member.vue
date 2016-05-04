<style>

.member {
  height: 50px;
  padding: 6px;
}

.member .nickname {
  float: left;
  margin-top: 5px;
}

.member button {
  float: right;
}

</style>

<template>

<div class="col-md-3">
  <div class="panel panel-default member">
    <div class="nickname">{{member.nickname}}</div>
    <button type="button" :class="{ 'btn': true, 'btn-success': member.switch }" v-on:click="switchMember">
      <span class="glyphicon glyphicon-send"></span>
    </button>
  </div>
</div>

</template>

<script>

import service from '../service'

module.exports = {

  name: 'Member',

  props: {
    member: Object,
    index: Number
  },

  methods: {
    switchMember() {
      this.$dispatch('switch-member', this.index)
    }
  }
}

</script>
