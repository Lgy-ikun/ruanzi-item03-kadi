const app = getApp();

const LOCAL_RECEIVED_KEY = 'coupon_receive_ids';

Page({
  data: {
    loading: true,
    couponList: [],
    useMockApi: true
  },

  onLoad() {
    this.loadCouponList();
  },

  getUserId() {
    const userIdFromStorage = wx.getStorageSync('userid');
    if (userIdFromStorage) {
      return String(userIdFromStorage);
    }
    if (app.globalData && app.globalData.userid) {
      return String(app.globalData.userid);
    }
    return '';
  },

  loadCouponList() {
    const userid = this.getUserId();
    if (!userid) {
      this.setData({
        loading: false,
        couponList: []
      });
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    if (this.data.useMockApi) {
      this.mockGetCouponList(userid)
        .then((list) => {
          const mergedList = this.mergeLocalReceivedState(list);
          this.setData({
            couponList: mergedList,
            loading: false
          });
        })
        .catch(() => {
          this.setData({
            couponList: [],
            loading: false
          });
          wx.showToast({
            title: '加载失败，请重试',
            icon: 'none'
          });
        });
      return;
    }

    wx.request({
      url: `${app.globalData.AUrl}/coupon/list`,
      method: 'GET',
      data: {
        userid
      },
      success: (res) => {
        const responseData = res && res.data ? res.data : {};
        const code = String(responseData.code || '');
        if (code !== '0' && code !== '200') {
          wx.showToast({
            title: responseData.message || '加载失败',
            icon: 'none'
          });
          this.setData({
            couponList: [],
            loading: false
          });
          return;
        }

        const rawList = responseData.data || [];
        const mergedList = this.mergeLocalReceivedState(rawList);
        this.setData({
          couponList: mergedList,
          loading: false
        });
      },
      fail: () => {
        this.setData({
          couponList: [],
          loading: false
        });
        wx.showToast({
          title: '网络异常，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  getCoupon(event) {
    const couponId = event.currentTarget.dataset.couponId;
    if (!couponId) {
      wx.showToast({
        title: '券信息异常',
        icon: 'none'
      });
      return;
    }

    const userid = this.getUserId();
    if (!userid) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const list = this.data.couponList || [];
    const index = list.findIndex((item) => String(item.couponId) === String(couponId));
    if (index < 0) {
      wx.showToast({
        title: '券不存在',
        icon: 'none'
      });
      return;
    }

    if (list[index].isReceived) {
      wx.showToast({
        title: '该券已领取',
        icon: 'none'
      });
      return;
    }

    const indexKey = `couponList[${index}].receiving`;
    this.setData({
      [indexKey]: true
    });

    if (this.data.useMockApi) {
      this.mockReceiveCoupon(userid, couponId)
        .then((result) => {
          if (!result.success) {
            throw new Error(result.message || '领取失败');
          }
          this.handleReceiveSuccess(index, couponId);
        })
        .catch((err) => {
          this.setData({
            [indexKey]: false
          });
          wx.showToast({
            title: err.message || '领取失败',
            icon: 'none'
          });
        });
      return;
    }

    wx.request({
      url: `${app.globalData.AUrl}/coupon/receive`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        userid,
        couponId
      },
      success: (res) => {
        const responseData = res && res.data ? res.data : {};
        const code = String(responseData.code || '');
        const success = code === '0' || code === '200';
        if (!success) {
          this.setData({
            [indexKey]: false
          });
          wx.showToast({
            title: responseData.message || '领取失败',
            icon: 'none'
          });
          return;
        }
        this.handleReceiveSuccess(index, couponId);
      },
      fail: () => {
        this.setData({
          [indexKey]: false
        });
        wx.showToast({
          title: '网络异常，领取失败',
          icon: 'none'
        });
      }
    });
  },

  handleReceiveSuccess(index, couponId) {
    this.setData({
      [`couponList[${index}].isReceived`]: true,
      [`couponList[${index}].receiving`]: false
    });
    this.saveReceivedCouponId(couponId);
    wx.showToast({
      title: '领取成功',
      icon: 'success'
    });
  },

  mergeLocalReceivedState(serverList) {
    const localReceivedIds = this.getLocalReceivedIds();
    return (serverList || []).map((item) => {
      const couponId = item.couponId || item.id || '';
      const serverReceived = !!item.isReceived;
      const localReceived = localReceivedIds.includes(String(couponId));
      return {
        couponId,
        couponName: item.couponName || item.name || '',
        amount: item.amount || item.atm || '0',
        validStart: item.validStart || item.startTime || '',
        validEnd: item.validEnd || item.endTime || '',
        ruleDesc: item.ruleDesc || item.note || '以券面说明为准',
        isReceived: serverReceived || localReceived,
        receiving: false
      };
    });
  },

  getLocalReceivedIds() {
    const ids = wx.getStorageSync(LOCAL_RECEIVED_KEY);
    if (Array.isArray(ids)) {
      return ids.map((id) => String(id));
    }
    return [];
  },

  saveReceivedCouponId(couponId) {
    const ids = this.getLocalReceivedIds();
    const targetId = String(couponId);
    if (ids.includes(targetId)) {
      return;
    }
    ids.push(targetId);
    wx.setStorageSync(LOCAL_RECEIVED_KEY, ids);
  },

  mockGetCouponList() {
    const mockData = [
      {
        couponId: 'C1001',
        couponName: '美式咖啡电子券',
        amount: 8,
        validStart: '2026-03-10',
        validEnd: '2026-04-10',
        ruleDesc: '满30元可用，每单限用1张',
        isReceived: false
      },
      {
        couponId: 'C1002',
        couponName: '全场通用电子券',
        amount: 12,
        validStart: '2026-03-10',
        validEnd: '2026-04-20',
        ruleDesc: '满50元可用，不与其他优惠同享',
        isReceived: false
      }
    ];

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData);
      }, 500);
    });
  },

  mockReceiveCoupon(userid, couponId) {
    return new Promise((resolve, reject) => {
      if (!userid || !couponId) {
        reject(new Error('参数缺失'));
        return;
      }

      setTimeout(() => {
        resolve({
          success: true,
          code: 0,
          message: '领取成功'
        });
      }, 500);
    });
  }
});
