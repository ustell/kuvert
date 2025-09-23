<template>
  <nav class="tabbar">
    <div class="inner">
      <RouterLink class="tab" :class="{active: $route.name==='dashboard'}" to="/">
        <div>🏠</div><div>Dashboard</div>
      </RouterLink>
      <RouterLink class="tab" :class="{active: $route.name==='accept'}" to="/accept">
        <div>🔁</div><div>Accept</div>
      </RouterLink>
      <RouterLink class="tab" :class="{active: $route.name==='create'}" to="/create">
        <div>➕</div><div>Create</div>
      </RouterLink>
      <RouterLink class="tab" :class="{active: $route.name==='admin'}" to="/admin">
        <div>⚙️</div><div>Admin</div>
      </RouterLink>
    </div>
  </nav>
</template>
<script setup>
</script>
