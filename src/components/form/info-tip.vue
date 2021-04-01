<template>
  <div class="info-tip">
    <Poptip trigger="hover" placement="bottom-start">
      <Icon type="ios-information-circle-outline" color="#2db7f5"/>
      <div slot="content" style="width: 400px;white-space: normal">
        <p>{{content}}</p>
      </div>
    </Poptip>
  </div>
</template>
<script>
  export default {
    props: {
      content: {
        type: String
      }
    },
    data: function () {
      return {
      }
    }
  };
</script>
