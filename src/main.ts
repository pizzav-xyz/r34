import { createApp } from 'vue'
import vuetify from '@/plugins/vuetify'
import pinia from '@/stores/index'
import router from '@/router'
import App from '@/App.vue'

import './styles/tokens.css'
import './styles/global.css'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error('Vue error:', err, info)
}

app.use(vuetify)
app.use(pinia)
app.use(router)

app.mount('#app')
