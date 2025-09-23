<template>
    <section class="card">
        <div class="h1">Accept Transfers</div>
        <div class="sub">Review and approve incoming transfers</div>
    </section>

    <section class="card mt16">
        <div class="space">
            <div class="row">
                <div class="icon">⏱</div>
                <strong>Pending Transfers</strong>
            </div>
            <span class="badge">1 waiting</span>
        </div>
    </section>

    <section class="card mt16">
        <div class="space">
            <strong>Transfer #2</strong>
            <span class="badge pending">pending</span>
        </div>
        <div class="small mt8">From: Mike Johnson • 16.01.2024</div>

        <div class="list mt16">
            <div class="list-item">
                <div class="row">
                    <div class="icon">⬢</div>
                    <div>Smartphone Assembly</div>
                </div>
                <span class="badge">3 units</span>
            </div>
            <div class="list-item">
                <div class="row">
                    <div class="icon">⬢</div>
                    <div>Laptop Kit</div>
                </div>
                <span class="badge">2 units</span>
            </div>
        </div>

        <div class="row" style="gap:10px;margin-top:14px">
            <button class="btn primary full">✓ Accept</button>
            <button class="btn full">✗ Reject</button>
        </div>
    </section>
</template>
<script setup>
</script>

<style></style>