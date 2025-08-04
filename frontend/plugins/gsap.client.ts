// plugins/gsap.client.ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default defineNuxtPlugin((nuxtApp) => {
  // Register only ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Provide GSAP and ScrollTrigger to the app
  nuxtApp.provide("gsap", gsap);
  nuxtApp.provide("ScrollTrigger", ScrollTrigger);
});
