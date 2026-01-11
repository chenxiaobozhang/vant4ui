import { createApp } from "vue";
import "./style.css";
import "vant/lib/index.css";
import Vant from "vant";
import '@vant/touch-emulator';
//import VueVirtualScroller from 'vue-virtual-scroller';
//import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import App from "./App.vue";
// import router from "./router";

const app = createApp(App);
app.use(Vant);
//app.use(VueVirtualScroller);
// app.use(router);

// 等待外部数据加载完成后再挂载应用
(async () => {
    if (window.dataLoaded) {
        await window.dataLoaded;
    }
    app.mount("#app");
})();
