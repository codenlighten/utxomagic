const getTxidInfo = async (txid) => {
	const url = `https://api.whatsonchain.com/v1/bsv/main/tx/hash/${txid}`;
	const response = await fetch(url);
	const json = await response.json();
	return json;
};
const utxos = async (address) => {
	const url = `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`;
	const response = await fetch(url);
	const json = await response.json();
	return json;
};

const returnUtxosWithoutTxid = async (utxos, txid) => {
	const utxo = utxos.filter((utxo) => {
		return utxo.txid !== txid;
	});
	return utxo;
};
const cleanupTxid = async () => {
	//get utxos
	const previousTxid = document.getElementById("previousTxid").value;
	const address = localStorage.getItem("address");
	const privateKey = localStorage.getItem("wif");
	const getUtxos = await utxos(address);
	//remove utxo with previous txid
	let utxosWithoutTxid = await returnUtxosWithoutTxid(getUtxos, previousTxid);
	utxosWithoutTxid = utxosWithoutTxid.filter((utxo) => {
		return utxo.value > 1000;
	});
	const info = await getTxidInfo(previousTxid);
	//add funds to previous txid
	const inputs = info.vout.map((vout, index) => {
		return {
			txId: previousTxid,
			outputIndex: index,
			satoshis: vout.value,
			script: vout.scriptPubKey.hex,
		};
	});
	//add funds to previous txid
	let total = 0;
	const outputs = utxosWithoutTxid.map((utxo) => {
		total += utxo.value;
		return {
			address: address,
			satoshis: utxo.value,
		};
	});
	//sign transaction
	console.log(total);
	const transaction = new bsv.Transaction()
		.from(inputs)
		.to(outputs)
		.sign(privateKey);
	const txid = await bsv.Transaction.broadcast(transaction.toString());
	return txid;
};
