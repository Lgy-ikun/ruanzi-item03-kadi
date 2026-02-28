Page({
  /**
   * 自定义导航栏返回按钮逻辑
   */
  goback() {
    // 返回上一页（和原生返回按钮逻辑一致）
    wx.navigateBack({
      delta: 1 // 返回1级页面（回到我的页面）
    });
  },

  /**
   * 点击立即购买（静态提示）
   */
  gotoBuy(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: `购买套餐${id}`,
      icon: 'none'
    });
    // 后续可替换为真实跳转：
    // wx.navigateTo({
    //   url: `/subPackages/package/pages/buy/buy?id=${id}`,
    // });
  }
});