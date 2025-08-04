<template>
  <div
    ref="container"
    class="relative"
    :style="{
      width: width + 'px',
      height: height + 'px',
      perspective: '900px',
      overflow: 'visible',
    }"
  >
    <div
      v-for="(item, i) in $slots.default?.()"
      :key="i"
      class="rounded-xl card-gradient-border bg-black"
    >
      <component :is="item" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, getCurrentInstance } from "vue";
import gsap from "gsap";

const props = defineProps({
  width: { type: Number, default: 500 },
  height: { type: Number, default: 400 },
  cardDistance: { type: Number, default: 60 },
  verticalDistance: { type: Number, default: 70 },
  delay: { type: Number, default: 5000 },
  pauseOnHover: { type: Boolean, default: false },
  skewAmount: { type: Number, default: 6 },
  easing: { type: String, default: "elastic" },
});

const container = ref<HTMLElement | null>(null);
let interval: number | undefined;
let order: number[] = [];
let cardEls: HTMLElement[] = [];

const makeSlot = (i: number, distX: number, distY: number, total: number) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLElement, slot: any, skew: number) => {
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: "center center",
    zIndex: slot.zIndex,
    force3D: true,
  });
};

const swap = (config: any) => {
  if (order.length < 2) return;
  const [front, ...rest] = order;
  const elFront = cardEls[front];
  const tl = gsap.timeline();
  tl.to(elFront, {
    y: "+=500",
    duration: config.durDrop,
    ease: config.ease,
  });
  tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
  rest.forEach((idx, i) => {
    const el = cardEls[idx];
    const slot = makeSlot(
      i,
      props.cardDistance,
      props.verticalDistance,
      cardEls.length,
    );
    tl.set(el, { zIndex: slot.zIndex }, "promote");
    tl.to(
      el,
      {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        duration: config.durMove,
        ease: config.ease,
      },
      `promote+=${i * 0.15}`,
    );
  });
  const backSlot = makeSlot(
    cardEls.length - 1,
    props.cardDistance,
    props.verticalDistance,
    cardEls.length,
  );
  tl.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
  tl.call(
    () => {
      gsap.set(elFront, { zIndex: backSlot.zIndex });
    },
    undefined,
    "return",
  );
  tl.set(elFront, { x: backSlot.x, z: backSlot.z }, "return");
  tl.to(
    elFront,
    {
      y: backSlot.y,
      duration: config.durReturn,
      ease: config.ease,
    },
    "return",
  );
  tl.call(() => {
    order = [...rest, front];
  });
};

const setupCards = () => {
  cardEls = Array.from(container.value?.children || []).filter(
    (el) => el.nodeType === 1,
  ) as HTMLElement[];
  cardEls.forEach((el) => {
    el.style.position = "absolute";
    el.style.top = "50%";
    el.style.left = "50%";
    el.style.transformStyle = "preserve-3d";
    el.style.backfaceVisibility = "hidden";
    el.classList.add("rounded-xl", "card-gradient-border", "bg-black");
  });
  order = Array.from({ length: cardEls.length }, (_, i) => i);
  const total = cardEls.length;
  cardEls.forEach((el, i) =>
    placeNow(
      el,
      makeSlot(i, props.cardDistance, props.verticalDistance, total),
      props.skewAmount,
    ),
  );
};

onMounted(() => {
  nextTick(() => {
    setupCards();
    const config =
      props.easing === "elastic"
        ? {
            ease: "elastic.out(0.6,0.9)",
            durDrop: 2,
            durMove: 2,
            durReturn: 2,
            promoteOverlap: 0.9,
            returnDelay: 0.05,
          }
        : {
            ease: "power1.inOut",
            durDrop: 0.8,
            durMove: 0.8,
            durReturn: 0.8,
            promoteOverlap: 0.45,
            returnDelay: 0.2,
          };
    swap(config);
    interval = window.setInterval(() => swap(config), props.delay);
    if (props.pauseOnHover && container.value) {
      container.value.addEventListener("mouseenter", () =>
        clearInterval(interval),
      );
      container.value.addEventListener("mouseleave", () => {
        interval = window.setInterval(() => swap(config), props.delay);
      });
    }
  });
});
</script>

<style scoped>
.card-gradient-border {
  border: 2.5px solid;
  border-radius: 1rem;
  border-image: linear-gradient(135deg, #ff256b 0%, #a445ff 50%, #00c6ff 100%) 1;
  box-shadow:
    0 0 32px 4px rgba(164, 69, 255, 0.25),
    0 0 48px 8px rgba(0, 198, 255, 0.18),
    0 0 0 2px rgba(255, 37, 107, 0.12);
  width: 500px;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #fff;
  background: linear-gradient(
    135deg,
    rgba(20, 20, 20, 0.85),
    rgba(40, 40, 40, 0.6)
  );
  backdrop-filter: blur(6px);
  margin: 0 auto;
  text-align: center;
  transition:
    width 0.3s,
    height 0.3s,
    font-size 0.3s,
    border-radius 0.3s;
}
@media (max-width: 1024px) {
  .card-gradient-border {
    width: 350px;
    height: 220px;
    font-size: 1.2rem;
    border-radius: 0.75rem;
  }
}
@media (max-width: 640px) {
  .card-gradient-border {
    width: 92vw;
    height: 140px;
    font-size: 1rem;
    border-radius: 0.5rem;
  }
}
</style>
