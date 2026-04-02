const app = getApp();
const storeUtils = require('../../../../utils/store');

Page({
  data: {
    stores: [],
    type: 'order',
    latitude: '',
    longitude: ''
  },

  onLoad(options) {
    this.setData({
      type: options.type || 'order'
    });

    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.getResult(itsid);
    } else {
      wx.showToast({
        title: '登录信息已失效',
        icon: 'none'
      });
    }

    this.getLocation();
  },

  onShow() {
    this.refreshStores();
  },

  getLocation() {
    wx.getLocation({
      type: 'wgs84',
      success: ({ latitude, longitude }) => {
        this.setData({
          latitude,
          longitude
        }, () => {
          this.refreshStores();
        });
      },
      fail: () => {
        this.refreshStores();
      }
    });
  },

  getResult(itsid) {
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10626&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === '1') {
          this.rawStores = res?.data?.result?.list || [];
          this.refreshStores();
          return;
        }

        wx.showToast({
          title: '门店加载失败',
          icon: 'none'
        });
      },
      fail: () => {
        wx.showToast({
          title: '门店加载失败',
          icon: 'none'
        });
      }
    });
  },

  refreshStores() {
    const selectedStoreId = String(wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId || '');
    const sourceStores = Array.isArray(this.rawStores) ? this.rawStores : [];
    const storesWithDistance = storeUtils.enrichStoresWithDistance(
      sourceStores,
      this.data.latitude,
      this.data.longitude
    );

    const stores = storesWithDistance.map((store) => {
      const businessTime = storeUtils.getStoreBusinessTime(store);
      return {
        ...store,
        isSelected: String(store.id) === selectedStoreId,
        displayAddress: storeUtils.getStoreAddress(store),
        displayBusinessTime: businessTime || '以门店实际为准',
        displayTag: storeUtils.getStoreTag(store)
      };
    });

    this.setData({ stores });
  },

  getStoreById(storeId) {
    const targetId = String(storeId || '');
    return (this.data.stores || []).find(store => String(store.id) === targetId)
      || (this.rawStores || []).find(store => String(store.id) === targetId)
      || null;
  },

  onCallStore(e) {
    const store = this.getStoreById(e.currentTarget.dataset.id);
    storeUtils.makeStorePhoneCall(store);
  },

  onNavigateStore(e) {
    const store = this.getStoreById(e.currentTarget.dataset.id);
    storeUtils.openStoreLocation(store);
  },

  onStoreSelect(e) {
    const storeId = String(e.currentTarget.dataset.id || '');
    const selectedStore = this.getStoreById(storeId);

    if (!selectedStore) {
      wx.showToast({
        title: '未找到门店',
        icon: 'none'
      });
      return;
    }

    app.globalData.selectedStoreName = selectedStore.name;
    app.globalData.storeName = selectedStore.name;
    app.globalData.selectedStoreId = storeId;
    app.globalData.selected = '自提';
    app.setStoreInfo && app.setStoreInfo(selectedStore);
    wx.setStorageSync('selectedStoreId', storeId);

    wx.showToast({
      title: `已选择：${selectedStore.name}`,
      icon: 'success',
      duration: 1600
    });

    if (this.data.type === 'order') {
      wx.switchTab({
        url: '/pages/order/order'
      });
      return;
    }

    if (this.data.type === 'jiesuan' || this.data.type === 'jiesuan-now') {
      wx.navigateBack();
    }
  }
});
