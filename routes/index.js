var express = require('express');
const logger = require("../util/logger");
const sequelize = require("../config/sequelize");
const dbmanager = require("../lib/dbmanager");

var router = express.Router();

const LinkaScannerAgentBalance = sequelize.db.linkaScannerAgentBalance;
const LinkaScannerAgentBlock = sequelize.db.linkaScannerAgentBlock;
const LinkaScannerAgentTransaction = sequelize.db.linkaScannerAgentTransaction;


/* GET home page. */
router.get('/', async function (req, res, next) {

    let order_block = [['blockNum', 'DESC']];
    let result_db_block = await dbmanager.dbSelectAll(req, LinkaScannerAgentBlock, null, order_block, 10);
    let result_block = [];
    if (result_db_block.result_code == true) {
        logger.debug("result_db_block:->" + JSON.stringify(result_db_block.result_data));
        logger.debug("result_db_block.result_data-count:->" + result_db_block.result_data.length);
        result_block = result_db_block.result_data;
    }

    let order_transaction = [['id', 'DESC']];
    let result_db_transaction = await dbmanager.dbSelectAll(req, LinkaScannerAgentTransaction, null, order_transaction, 10);
    let result_transaction = [];
    if (result_db_transaction.result_code == true) {
        result_transaction = result_db_transaction.result_data;
    }
    res.render('index', { blockList: result_block, transactionList: result_transaction });
});
router.get('/block/:blocknumber', async function (req, res, next) {

    let block_number = req.params.blocknumber;
    if (block_number.toString().length == 64) {
        let where_block = {
            blockHash: block_number
        }
        let result_db_block = await dbmanager.dbSelectOne(req, LinkaScannerAgentBlock, where_block);
        let result_block = [];
        if (result_db_block.result_code == true) {
            result_block = result_db_block.result_data;
            res.render('detailBlock', { block: result_block });
            return;
        }
    }
    where_block = {
        blockNum: block_number
    }
    result_db_block = await dbmanager.dbSelectOne(req, LinkaScannerAgentBlock, where_block);
    if (result_db_block.result_code == true) {
        result_block = result_db_block.result_data;
    } else {
        res.render('errorPage', { inputstring: block_number });
        return;
    }
    res.render('detailBlock', { block: result_block });
});


router.get('/tx/:txhash', async function (req, res, next) {

    let tx_hash = req.params.txhash;
    let where_transaction = {
        txHash: tx_hash
    }
    let result_db_transaction = await dbmanager.dbSelectOne(req, LinkaScannerAgentTransaction, where_transaction);
    let result_transaction = [];
    let from_balance = "NONCE";
    let to_balance = "NONCE";
    if (result_db_transaction.result_code == true) {
        result_transaction = result_db_transaction.result_data;

        let from_address = null;
        let to_address = null;
        if (JSON.parse(result_transaction.writeSet)[1].key.substr(0, 5) != "NONCE") {
            from_address = JSON.parse(result_transaction.writeSet)[2].key.substr(5);
            to_address = (JSON.parse(result_transaction.writeSet)[1].key == from_address) ? JSON.parse(result_transaction.writeSet)[0].key : JSON.parse(result_transaction.writeSet)[1].key;

        } else {
            from_address = JSON.parse(result_transaction.writeSet)[0].key;

        }
        logger.debug(to_address + "   " + from_address);

        let where_from_balance = {
            address: from_address
        }
        let where_to_balance = {
            address: to_address
        }
        let from_db_balance = await dbmanager.dbSelectOne(req, LinkaScannerAgentBalance, where_from_balance);
        let to_db_balance = [];
        if (to_address != null) {
            to_db_balance = await dbmanager.dbSelectOne(req, LinkaScannerAgentBalance, where_to_balance);
            if (to_db_balance.result_code == true) {
                to_balance = to_db_balance.result_data.currencyType;
            }
        }
        if (from_db_balance.result_code == true) {
            from_balance = from_db_balance.result_data.currencyType;
        }


    } else {
        res.render('errorPage', { inputstring: tx_hash });
        return;
    }
    res.render('detailTransaction', { transaction: result_transaction, fromtype: from_balance, totype: to_balance });
});




router.get('/txs', async function (req, res, next) {
    let page = req.query.p ? req.query.p : 1;
    let ps = parseInt(req.query.ps ? req.query.ps : 10);
    let limit_transaction = [(page - 1) * ps, ps];

    let block_number = -1;
    let where_transaction = {};
    let order_transaction = [['id', 'DESC']];
    if (req.query.block != null && req.query.block != -1) {
        block_number = req.query.block;
        where_transaction = {
            blockId: block_number
        };
    }
    let result_db_transaction = await dbmanager.dbSelectAll(req, LinkaScannerAgentTransaction, where_transaction, order_transaction, limit_transaction);
    let result_transaction = [];
    if (result_db_transaction.result_code == true) {
        // logger.debug("result_db_transaction:->" + JSON.stringify(result_db_transaction.result_data));

        result_transaction = result_db_transaction.result_data;
    }
    let transaction_db_count = await dbmanager.dbCount(req, LinkaScannerAgentTransaction, where_transaction);
    let transaction_count = 0;
    if (transaction_db_count.result_code == true) {

        transaction_count = transaction_db_count.result_data;
    }
    res.render('showTransactions', { blockNum: block_number, transactionList: result_transaction, currentPage: page, transactionCount: transaction_count, wordNum: ps });
});



router.get('/blocks', async function (req, res, next) {
    let page = req.query.p ? req.query.p : 1;
    let ps = parseInt(req.query.ps ? req.query.ps : 10);
    let limit_transaction = [(page - 1) * ps, ps];
    let order_block = [['blockNum', 'DESC']];
    let result_db_block = await dbmanager.dbSelectAll(req, LinkaScannerAgentBlock, null, order_block, limit_transaction);
    let result_block = [];
    if (result_db_block.result_code == true) {
        // logger.debug("result_db_block.result_data[0].from:->" + result_db_block.result_data[0].writeSet);
        result_block = result_db_block.result_data;
    }

    let block_db_count = await dbmanager.dbCount(req, LinkaScannerAgentBlock, null);
    let block_count = 0;
    if (block_db_count.result_code == true) {
        block_count = block_db_count.result_data;
    }

    res.render('showBlocks', { blockList: result_block, currentPage: page, blockCount: block_count, wordNum: ps });



});


router.get('/address/:address', async function (req, res, next) {
    let balance_address = req.params.address;
    let where_balance = {
        address: balance_address
    }
    let result_db_balance = await dbmanager.dbSelectOne(req, LinkaScannerAgentBalance, where_balance);
    let result_balance = [];
    if (result_db_balance.result_code == true) {
        result_balance = result_db_balance.result_data;
    } else {
        res.render('errorPage', { inputstring: balance_address });
        return;
    }
    res.render('detailAddress', { balance: result_balance });
});

router.get('/search/b/:searchblock', async function (req, res, next) {
    let block_hash = req.params.searchblock;
    res.redirect("/block/" + block_hash);
});

router.get('/search/t/:searchtx', async function (req, res, next) {
    let transaction_hash = req.params.searchtx;
    res.redirect("/tx/" + transaction_hash);
});

router.get('/search/a/:searchaddress', async function (req, res, next) {
    let balance_address = req.params.searchaddress;
    res.redirect("/address/" + balance_address);
});

router.get('/search/a/:search', async function (req, res, next) {
    let hash = req.params.search;
    let where_transaction = {
        txHash: hash
    }
    let where_balance = {
        address: hash
    }
    let result_db_transaction = await dbmanager.dbCount(req, LinkaScannerAgentTransaction, where_transaction);
    let result_db_balance = await dbmanager.dbCount(req, LinkaScannerAgentBalance, where_balance);
    if (result_db_transaction.result_code == true && result_db_transaction.result_data > 0) {
        res.redirect("/tx/" + hash);
        return;
    } else if (result_db_balance.result_code == true && result_db_balance.result_data > 0) {
        res.redirect("/address/" + hash);
        return;
    } else {
        res.redirect("/block/" + hash);
        return;
    }
});



module.exports = router;
