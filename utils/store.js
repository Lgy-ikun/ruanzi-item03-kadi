function formatDistanceText(distance) {
  const distanceValue = Number(distance);
  if (!Number.isFinite(distanceValue) || distanceValue < 0) {
    return '';
  }

  if (parseInt(distanceValue, 10) >= 1) {
    return `${distanceValue.toFixed(1)}km`;
  }

  return `${Math.round(distanceValue * 1000)}m`;
}

function rad(value) {
  return value * Math.PI / 180.0;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const radLat1 = rad(lat1);
  const radLat2 = rad(lat2);
  const a = radLat1 - radLat2;
  const b = rad(lng1) - rad(lng2);
  let distance = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
  ));

  distance = distance * 6378.137;
  distance = Math.round(distance * 10000) / 10000;
  return distance;
}

function getStoreAddress(store = {}) {
  const address = [
    store.add,
    store.address,
    store.addressDesc,
    [store.province, store.city, store.street, store.door].filter(Boolean).join('')
  ].find(item => typeof item === 'string' && item.trim());

  return (address || '').trim();
}

function getStoreBusinessTime(store = {}) {
  const directValue = [
    store.yytime,
    store.businesshours,
    store.businessHours,
    store.openTime,
    store.opentime,
    store.worktime,
    store.workTime,
    store.yysj
  ].find(item => typeof item === 'string' && item.trim());

  if (directValue) {
    return directValue.trim();
  }

  const start = String(store.starttime || store.startTime || '').trim();
  const end = String(store.endtime || store.endTime || '').trim();
  if (start && end) {
    return `${start}-${end}`;
  }

  return '';
}

function getStoreTag(store = {}) {
  const arrayTag = Array.isArray(store.labels) ? store.labels.find(item => typeof item === 'string' && item.trim()) : '';
  const directValue = [
    arrayTag,
    store.tag,
    store.tagName,
    store.label,
    store.remark,
    store.mark
  ].find(item => typeof item === 'string' && item.trim());

  return directValue ? directValue.trim() : '';
}

function getStorePhone(store = {}) {
  const rawValue = [
    store.phone,
    store.tel,
    store.telephone,
    store.mobile,
    store.contactPhone,
    store.contactphone,
    store.storephone,
    store.phoneNumber
  ].find(item => typeof item === 'string' && item.trim());

  if (!rawValue) {
    return '';
  }

  const phone = rawValue
    .split(/[\/,;\s]+/)
    .map(item => item.trim())
    .find(Boolean);

  return phone || '';
}

function openStoreLocation(store) {
  if (!store) {
    wx.showToast({
      title: '未找到门店',
      icon: 'none'
    });
    return false;
  }

  const latitude = parseFloat(store.longitude);
  const longitude = parseFloat(store.latitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    wx.showToast({
      title: '门店位置信息缺失',
      icon: 'none'
    });
    return false;
  }

  wx.openLocation({
    latitude,
    longitude,
    name: store.name || '门店',
    address: getStoreAddress(store),
    success() { },
    fail() {
      wx.showToast({
        title: '导航失败',
        icon: 'none'
      });
    }
  });

  return true;
}

function makeStorePhoneCall(store) {
  const phoneNumber = getStorePhone(store);
  if (!phoneNumber) {
    wx.showToast({
      title: '门店暂无联系电话',
      icon: 'none'
    });
    return false;
  }

  wx.makePhoneCall({
    phoneNumber,
    fail() {
      wx.showToast({
        title: '拨号失败',
        icon: 'none'
      });
    }
  });

  return true;
}

function enrichStoresWithDistance(stores = [], latitude, longitude) {
  const userLatitude = Number(latitude);
  const userLongitude = Number(longitude);
  const hasLocation = Number.isFinite(userLatitude) && Number.isFinite(userLongitude);

  return (stores || []).map((store) => {
    if (!hasLocation) {
      return {
        ...store,
        distanceText: '',
        distanceValue: ''
      };
    }

    const storeLatitude = parseFloat(store.longitude);
    const storeLongitude = parseFloat(store.latitude);
    if (!Number.isFinite(storeLatitude) || !Number.isFinite(storeLongitude)) {
      return {
        ...store,
        distanceText: '',
        distanceValue: ''
      };
    }

    const distanceValue = calculateDistance(userLatitude, userLongitude, storeLatitude, storeLongitude);
    return {
      ...store,
      distanceValue: distanceValue.toFixed(2),
      distanceText: formatDistanceText(distanceValue)
    };
  });
}

function findNearestStore(latitude, longitude, stores = []) {
  let nearestStore = null;
  let minDistance = Infinity;

  (stores || []).forEach((store) => {
    const storeLatitude = parseFloat(store.latitude);
    const storeLongitude = parseFloat(store.longitude);
    const distance = calculateDistance(latitude, longitude, storeLongitude, storeLatitude);

    if (distance < minDistance) {
      minDistance = distance;
      nearestStore = {
        ...store,
        distance: distance.toFixed(2)
      };
    }
  });

  return nearestStore;
}

module.exports = {
  calculateDistance,
  enrichStoresWithDistance,
  findNearestStore,
  formatDistanceText,
  getStoreAddress,
  getStoreBusinessTime,
  getStorePhone,
  getStoreTag,
  makeStorePhoneCall,
  openStoreLocation
};
