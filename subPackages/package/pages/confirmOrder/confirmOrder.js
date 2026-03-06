Page({
  data: {
    packageId: '',
    packageName: '',
    packageTag: '会员套餐',
    payAmount: '0.00',
    coffeeAmount: '0.00',
    totalAmount: '0.00',
    multiple: '0.0',
    totalReturn: '0.00',
    days: '0',
    dailyReturn: '0.00'
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        packageId: options.id
      });
      this.loadPackageDetails(options.id);
    }
  },

  loadPackageDetails(id) {
    // 这里模拟数据，实际应该根据id获取详情或者从上个页面传递参数
    let details = {};
    if (id === '1') {
      details = {
        packageName: '卡狄D套餐',
        payAmount: '600.00',
        coffeeAmount: '400.00',
        totalAmount: '1000.00',
        multiple: '1.7倍',
        totalReturn: '1700.00',
        days: '360天',
        dailyReturn: '4.72'
      };
    } else if (id === '2') {
      details = {
        packageName: '卡狄C套餐',
        payAmount: '1800.00',
        coffeeAmount: '1200.00',
        totalAmount: '3000.00',
        multiple: '1.8倍',
        totalReturn: '5400.00',
        days: '360天',
        dailyReturn: '15.00'
      };
    } else if (id === '3') {
      details = {
        packageName: '卡狄B套餐',
        payAmount: '5400.00',
        coffeeAmount: '3600.00',
        totalAmount: '9000.00',
        multiple: '1.9倍',
        totalReturn: '17100.00',
        days: '360天',
        dailyReturn: '47.50'
      };
    } else if (id === '4') {
      details = {
        packageName: '卡狄A套餐',
        payAmount: '16200.00',
        coffeeAmount: '10800.00',
        totalAmount: '27000.00',
        multiple: '2倍',
        totalReturn: '54000.00',
        days: '360天',
        dailyReturn: '150.00'
      };
    }
    this.setData(details);
  },

  submitOrder() {
    wx.showToast({
      title: '支付功能开发中',
      icon: 'none'
    });
  }
});