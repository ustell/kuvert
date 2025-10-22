<script setup lang="ts">
import Card from '../components/Card.vue';
import Badge from '../components/Badge.vue';
import Button from '../components/Button.vue';
import ListItem from '../components/ListItem.vue';
import { useTrans } from '../stores/transfer';
import { useAuth } from '../stores';

const trans = useTrans();
const currentUser = useAuth();

const accept = (transferId: string, userId: string) => {
  console.log(transferId, userId);
  try {
    const res = trans.accept(transferId, userId);
    console.log(res);
  } catch (error) {}
};
const reject = (transferId: string, userId: string) => {
  try {
    const res = trans.reject(transferId, userId);
    console.log(res);
  } catch (error) {}
};
</script>
<template>
  <div class="container">
    <div class="page-head">
      <div class="title-18">Подтверждение переводов</div>
      <div class="muted">Проверьте входящие переводы</div>
    </div>

    <Card padded>
      <div class="row-between">
        <div class="title-16">Ожидается перевод</div>
        <span class="chip">1 в ожидании</span>
      </div>
    </Card>

    <Card
      padded
      v-for="value in trans.transfer?.filter((i) => i.toUser?.id === currentUser.users?.id)"
    >
      <div class="row-between mb8">
        <div class="title-16">Перевод #{{ value.id }}</div>
        <Badge kind="pending">Ожидание</Badge>
      </div>
      <div class="mb12">От: {{ value.fromUserId }} • 16.01.2024</div>

      <ListItem>
        <template #default>{{ value.item?.name }}</template>
        <template #right
          ><span class="pill">{{ value.units }}</span></template
        >
      </ListItem>
      <div class="btn-row">
        <Button variant="primary" @click="accept(value.id, value.toUserId)">✓ Подтвердить</Button>
        <Button variant="danger" @click="reject(value.id, value.fromUserId)">✕ Отказать</Button>
      </div>
    </Card>
    <Card padded>
      <div class="row-between mb8">
        <div class="title-16">Перевод #2</div>
        <Badge kind="pending">Ожидание</Badge>
      </div>
      <div class="muted mb12">От: Mike Johnson • 16.01.2024</div>

      <ListItem>
        <template #default>Smartphone Assembly</template>
        <template #right><span class="pill">3 units</span></template>
      </ListItem>
      <ListItem>
        <template #default>Laptop Kit</template>
        <template #right><span class="pill">2 units</span></template>
      </ListItem>

      <div class="btn-row">
        <Button variant="primary">✓ Подтвердить</Button>
        <Button variant="danger">✕ Отказать</Button>
      </div>
    </Card>
  </div>
</template>

<style>
:root {
  --brand-green: #8ed645;
  --brand-dark: #1f2a37;
  --text: #0b1220;
  --muted: #5b6775;
  --bg: #f7f9fc;
  --sg-ink: #0e1420;
  --sg-muted: #647084;
  --sg-bg: #ffffff;
  --sg-accent: #8fd14f;
  --sg-accent-2: #1e2836;
  --sg-radius: 16px;
}

.safeguard-hero {
  position: relative;
  background: var(--sg-bg);
  border-radius: var(--sg-radius);
  overflow: clip;
  margin: clamp(8px, 2vw, 18px) auto;
}

.safeguard-hero::before {
  content: '';
  position: absolute;
  inset: -20% -10% auto -10%;
  height: 60%;
  transform: skewY(-6deg);
  background: linear-gradient(90deg, #f1f7ea 0%, #f7fff1 40%, #ffffff 100%);
  z-index: 0;
}

.safeguard-hero__wrap {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: clamp(16px, 3vw, 32px);
  padding: clamp(18px, 3vw, 36px);
  min-height: 420px;
}

.safeguard-hero__content {
  order: 2;
  color: var(--sg-ink);
}
.safeguard-hero__title {
  margin: 0 0 0.3em;
  font-size: clamp(28px, 3.8vw, 46px);
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.safeguard-hero__title em {
  font-style: normal;
  color: var(--sg-muted);
  font-weight: 500;
}
.safeguard-hero__lead {
  margin: 0 0 1rem;
  color: var(--sg-muted);
  font-size: clamp(14px, 1.2vw, 18px);
}

.safeguard-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 14px;
}

.chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(143, 209, 79, 0.25);
}

.safeguard-hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}
.btn-solid {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 18px;
  border-radius: 12px;
  background: var(--sg-accent);
  color: #0b1405;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(143, 209, 79, 0.35);
  transition: transform 0.08s ease, box-shadow 0.18s ease, background 0.18s ease;
}
.btn-solid:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(143, 209, 79, 0.45);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 16px;
  border-radius: 12px;
  border: 2px solid var(--sg-accent-2);
  color: var(--sg-accent-2);
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.08s ease, background 0.18s ease, color 0.18s ease;
}
.btn-outline:hover {
  background: var(--sg-accent-2);
  color: #fff;
  transform: translateY(-1px);
}

.safeguard-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: var(--sg-muted);
  font-size: 0.95rem;
}
.meta-sep {
  opacity: 0.5;
}

.safeguard-hero__media {
  order: 1;
  position: relative;
  justify-self: end;
  filter: drop-shadow(0 20px 36px rgba(0, 0, 0, 0.12));
}
.safeguard-hero__img {
  display: block;
  inline-size: min(620px, 100%);
  border-radius: 18px;
  transform: rotate(-3deg);
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.safeguard-hero:hover .safeguard-hero__img {
  transform: rotate(0deg);
}

.safeguard-hero__flag {
  position: absolute;
  left: -10px;
  top: 12px;
  transform: rotate(-90deg);
  transform-origin: left top;
  background: var(--sg-accent-2);
  color: #fff;
  padding: 8px 14px;
  border-radius: 10px 10px 0 0;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.8rem;
}
.safeguard-hero__discount {
  position: absolute;
  right: 12px;
  top: 12px;
  background: #111;
  color: #fff;
  font-weight: 800;
  font-size: 0.9rem;
  padding: 8px 10px;
  border-radius: 10px;
  opacity: 0.95;
}

/* tablet & mobile */

/* ---- PARTNER HERO: визуально совместим с Safeguard B ---- */
:root {
}

.partner-hero {
  position: relative;
  background: var(--sg-bg);
  border-radius: var(--sg-radius);
  overflow: clip;
  margin: clamp(8px, 2vw, 18px) auto;
}
.partner-hero::before {
  content: '';
  position: absolute;
  inset: -22% -12% auto -12%;
  height: 62%;
  transform: skewY(-6deg);
  background: linear-gradient(90deg, #f1f7ea 0%, #f7fff1 40%, #ffffff 100%);
  z-index: 0;
}
.partner-hero__wrap {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: clamp(16px, 3vw, 32px);
  padding: clamp(18px, 3vw, 36px);
  min-height: 400px;
}

/* content */
.partner-hero__content {
  color: var(--sg-ink);
}
.partner-hero__title {
  margin: 0 0 0.35rem;
  font-size: clamp(26px, 3.6vw, 44px);
  line-height: 1.06;
  letter-spacing: -0.02em;
}
.partner-hero__title em {
  display: block;
  font-style: normal;
  color: var(--sg-muted);
  font-weight: 500;
}
.partner-hero__lead {
  margin: 0 0 1rem;
  color: var(--sg-muted);
  font-size: clamp(14px, 1.2vw, 18px);
}

.partner-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 14px;
}

.chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(143, 209, 79, 0.25);
}

.partner-hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}
.btn-solid {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 18px;
  border-radius: 12px;
  background: var(--sg-accent);
  color: #0b1405;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(143, 209, 79, 0.35);
}
.btn-solid:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(143, 209, 79, 0.45);
}
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 16px;
  border-radius: 12px;
  border: 2px solid var(--sg-accent-2);
  color: var(--sg-accent-2);
  font-weight: 800;
  text-decoration: none;
}
.btn-outline:hover {
  background: var(--sg-accent-2);
  color: #fff;
  transform: translateY(-1px);
}

.partner-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--sg-muted);
  font-size: 0.95rem;
}
.meta-sep {
  opacity: 0.5;
}

/* media — абстрактная стопка документов и печать НДС (без картинок) */
.partner-hero__media {
  position: relative;
  justify-self: end;
  width: min(560px, 100%);
  aspect-ratio: 4/3;
}
.doc {
  position: absolute;
  inset: auto auto 0 0;
  width: 68%;
  height: 52%;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.doc--2 {
  left: 10%;
  bottom: 10%;
  width: 72%;
  height: 56%;
  transform: rotate(-4deg);
}
.doc--1 {
  left: 20%;
  bottom: 22%;
  width: 76%;
  height: 60%;
  transform: rotate(-8deg);
}
.doc--3 {
  right: -2%;
  left: auto;
  bottom: 6%;
  width: 44%;
  height: 64%;
  transform: rotate(6deg);
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 60%);
}
.stamp {
  position: absolute;
  right: 8%;
  bottom: 18%;
  border: 3px solid #1e2836;
  color: #1e2836;
  padding: 0.35rem 0.55rem;
  border-radius: 8px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: #fff;
  transform: rotate(-10deg);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

/* responsive */

.hero-deli__inner {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: clamp(16px, 3vw, 32px);
  padding: clamp(16px, 3vw, 32px);
  min-height: 420px;
  background: radial-gradient(1200px 300px at 75% 40%, var(--bg), transparent);
}
.hero-deli__content {
  position: relative;
  z-index: 2;
}
.hero-deli__badge {
  display: inline-block;
  font-size: 12px;
  line-height: 1;
  background: var(--sg-accent);
  color: #0a0a0a;
  font-weight: 700;
  border-radius: 999px;
  padding: 8px 10px;
  margin-bottom: 10px;
}
.hero-deli__title {
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0 0 8px;
}
.hero-deli__subtitle {
  font-size: clamp(14px, 1.5vw, 18px);
  color: var(--muted);
  margin: 0 0 18px;
}
.hero-deli__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  height: 46px;
  padding: 0 18px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: transform 0.08s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.btn--primary {
  background: var(--sg-accent);
  color: #0b0b0b;
  border: 2px solid #cfefb0;
}
.btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(40, 200, 40, 0.18);
}
.btn--link {
  color: var(--brand-dark);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hero-deli__trust {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  color: var(--muted);
  font-size: 14px;
}
.hero-deli__trust li {
  display: flex;
  gap: 6px;
  align-items: center;
}
.hero-deli__trust svg {
  inline-size: 16px;
  block-size: 16px;
  fill: var(--sg-accent);
}

.hero-deli__media {
  position: relative;
  justify-self: end;
}
.hero-deli__img {
  display: block;
  inline-size: min(640px, 100%);
  block-size: auto;
  filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.12));
  border-radius: 18px; /* аккуратный скруг */
}
.hero-deli__sale-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #111;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  padding: 8px 10px;
  border-radius: 10px;
  opacity: 0.92;
}

/* tablet */
@media (max-width: 1024px) {
  .partner-hero__wrap {
    grid-template-columns: 1fr;
    min-height: unset;
  }
  .partner-hero__media {
    order: -1;
    justify-self: center;
    width: min(520px, 100%);
  }
  .hero-deli__inner {
    grid-template-columns: 1fr;
    min-height: unset;
  }
  .hero-deli__media {
    order: -1;
    justify-self: center;
  } /* картинка выше, текст ниже */
  .hero-deli__img {
    inline-size: min(540px, 100%);
  }
  .hero-deli__subtitle {
    margin-bottom: 14px;
  }
  .safeguard-hero__wrap {
    grid-template-columns: 1fr;
    min-height: unset;
  }
  .safeguard-hero__media {
    order: -1;
    justify-self: center;
  }
  .safeguard-hero__img {
    inline-size: min(520px, 100%);
  }
  .safeguard-hero__flag {
    transform: none;
    left: 12px;
    top: auto;
    bottom: 12px;
    border-radius: 10px;
  }
}
/* mobile */
@media (max-width: 480px) {
  .partner-hero__wrap {
    padding: 18px;
  }
  .btn-solid,
  .btn-outline {
    height: 44px;
    border-radius: 10px;
  }
  .hero-deli__inner {
    padding: 18px;
  }
  .btn {
    height: 44px;
    border-radius: 10px;
  }
  .hero-deli__img {
    inline-size: 100%;
  }
  .safeguard-hero__wrap {
    padding: 18px;
  }
  .btn-solid,
  .btn-outline {
    height: 44px;
    border-radius: 10px;
  }
  .safeguard-hero__img {
    inline-size: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .safeguard-hero__img,
  .chip,
  .btn-solid,
  .btn-outline {
    transition: none;
  }
}
</style>
