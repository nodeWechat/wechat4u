import axios from 'axios'

const service = {}

export default service

let uuid = window.localStorage.uuid || ''

service.getUUID = () => {
  return axios.get('/api/uuid').then(res => {
    uuid = window.localStorage.uuid = res.data
    return uuid
  })
}

service.checkLogin = () => {
  return axios.get('/api/instance/' + uuid)
}

service.loginConfirm = () => {
  return axios.get('/api/login/' + uuid)
}

service.getMembers = () => {
  return axios.get('/api/members/' + uuid).then(res => {
    return res.data
  })
}

service.switchAutoReply = memberId => {
  return axios.get('/api/members/' + uuid + '/' + memberId)
}

service.switchSupervise = memberId => {
  return axios.get('/api/supervise/' + uuid + '/' + memberId)
}
