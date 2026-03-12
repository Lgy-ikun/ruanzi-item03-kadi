const app = getApp();

Page({
  data: {
    amount: '' // 充值金额
  },

  // 监听输入，严格限制只能输入正数且最多两位小数
  handleInput(e) {
    let value = e.detail.value;
    // 使用正则：限制只能输入数字和一个小数点，且小数点后最多两位
    value = value.replace(/[^\d.]/g, ''); // 清除数字和小数点以外的字符
    value = value.replace(/^\./g, ''); // 验证第一个字符不能是小数点
    value = value.replace(/\.{2,}/g, '.'); // 只保留第一个小数点
    value = value.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.'); // 保证只出现一次小数点
    value = value.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3'); // 只能输入两个小数
    
    this.setData({ amount: value });
  },

  // 创建充值订单
  createOrder() {
    const { amount } = this.data;
    const numAmount = parseFloat(amount);

    // 1. 严格校验金额
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return wx.showToast({ title: '请输入正确的充值金额', icon: 'none' });
    }

    // 2. 校验登录状态
    const itsid = wx.getStorageSync('itsid');
    if (!itsid) {
      return wx.showToast({ title: '请先登录', icon: 'none' });
    }

    wx.showLoading({ title: '创建订单中...', mask: true });

    // ⚠️ 核心修复：还原原代码的纯数字类型
    // toFixed(2) 会变成字符串，外面必须套一层 Number() 重新转回纯数字
    const finalAmt = Number(numAmount.toFixed(2)); 

    // 3. 调用后端接口创建订单
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10634&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        MCODE: 920,       // ✅ 修复：严格对标原代码，不加引号的数字 920
        OPID: '1207', 
        UNITID: '1', 
        NUM: 1,           // ✅ 修复：数字 1
        USERID: '0', 
        NOTE: ' ', 
        AMT: finalAmt,    // ✅ 修复：纯数字金额
        RURL: '/subPackages/package/pages/recharge-result/recharge-result' // 这只是个跳转路径字符串，不影响创建
      },
      success: (res) => {
        // 先隐藏 loading，防止和下面的 showToast 冲突
        wx.hideLoading();
        
        console.log("10634接口返回的真实数据:", res.data);

        // 判断是否真正成功创建了订单
        if (res.statusCode === 200 && res.data && res.data.orderid) {
          const data = res.data;
          const pkg = encodeURIComponent(data.package || '');
          const pSign = encodeURIComponent(data.paySign || '');
          
          // 跳转到全新收银台
          wx.navigateTo({
            url: `/subPackages/package/pages/new-recharge-pay/new-recharge-pay?return_url=${data.rurl}&orderid=${data.orderid}&terminal=${data.terminal_sn}&amt=${data.AMT}&sign=${data.sign}&appId=${data.appId}&nonceStr=${data.nonceStr}&package=${pkg}&paySign=${pSign}&signType=${data.signType}&timeStamp=${data.timeStamp}`
          });
        } else {
          // 打印后台拒绝的具体原因
          const errorMsg = res.data.msg || res.data.message || '订单创建失败';
          wx.showToast({ title: errorMsg, icon: 'none', duration: 2500 });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("网络异常：", err);
        wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      }
    });
  }
});