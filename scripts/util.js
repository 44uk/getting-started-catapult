const {
  Listener,
  TransactionHttp,
} = require('nem2-sdk');

exports.listener = (url, address, hooks = {}) => {
  const excerptAddress = address.plain().slice(0,6);
  const nextObserver = (label, hook) => info => {
    try {
      console.log('[%s] %s...\n%s\n', label, excerptAddress, JSON.stringify(info));
    }  catch (error) {
      // console.error({error});
    }
    finally {
      typeof hook === 'function' && hook(info, listener);
    }
  };
  const errorObserver = err => console.error(err);
  // リスナーオブジェクトを用意
  const listener = new Listener(url);
  // リスナーを開いて接続を試みる
  listener.open().then(() => {
    hooks.onOpen && hooks.onOpen(listener);
    // 接続されたら各アクションの監視を定義
    listener
      .status(address)
      .subscribe(nextObserver('STATUS', hooks.onStatus), errorObserver);
    listener
      .unconfirmedAdded(address)
      .subscribe(nextObserver('UNCONFIRMED', hooks.onUnconfirmed), errorObserver);
    listener
      .confirmed(address)
      .subscribe(nextObserver('CONFIRMED', hooks.onConfirmed), errorObserver);
    listener
      .aggregateBondedAdded(address)
      .subscribe(nextObserver('AGGREGATE_BONDED_ADDED', hooks.onAggregateBondedAdded), errorObserver);
    listener
      .cosignatureAdded(address)
      .subscribe(nextObserver('COSIGNATURE_ADDED', hooks.onCosignatureAdded), errorObserver);
  });
  return listener;
};

// 以下は発信時に呼び出す`transactionHttp`のメソッドが異なるだけです。
exports.announce = (url, tx, ...subscriber) => {
  const transactionHttp = new TransactionHttp(url)
  const subscription = transactionHttp.announce(tx)
  announceUtil(subscription, url, tx, ...subscriber)
}

exports.announceAggregateBonded = (url, tx, ...subscriber) => {
  const transactionHttp = new TransactionHttp(url)
  const subscription = transactionHttp.announceAggregateBonded(tx)
  announceUtil(subscription, url, tx, ...subscriber)
}

exports.announceAggregateBondedCosignature = (url, tx, ...subscriber) => {
  const transactionHttp = new TransactionHttp(url)
  const subscription = transactionHttp.announceAggregateBondedCosignature(tx)
  announceUtil(subscription, url, tx, ...subscriber)
}

// 発信用の便利関数
const announceUtil = (subscription, url, tx, ...subscriber) => {
  if (0 < subscriber.length && subscriber.length <= 3) {
    return subscription.subscribe(...subscriber);
  }
  // `announce`メソッドに署名済みトランザクションオブジェクトを渡す
  // `subscribe`メソッドで処理が開始される
  return subscription.subscribe(
    () => {
      // 流れてくるレスポンスは常に成功しか返さないので、
      // `tx`の情報を出力する。
      console.log('[Transaction announced]');
      console.log('Endpoint: %s/transaction/%s', url, tx.hash);
      console.log('Hash:     %s', tx.hash);
      console.log('Signer:   %s', tx.signer);
      console.log('');
    },
    err => {
      console.log(
        'Error: %s',
        err.response !== undefined ? err.response.text : err
      );
    }
  );
};
