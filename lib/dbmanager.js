'use strict';

const sequelize = require("../config/sequelize");
const logger = require("../util/logger");
const utils = require("../util");

let transaction = null;

const dbInsert = async (req, objTable, values) => {
    try {
        transaction = await sequelize.db.transaction();

        await objTable.create(values, { transaction });
        await transaction.commit();

        return utils.convertToApiResult(true, "");

    } catch (error) {
        logger.error(req.rowId, error.stack);
    
        if (transaction) {
          await transaction.rollback();
        }

        return utils.convertToApiResult(false, error.message);
    }
};

const dbSelectAll = async (req, objTable, values, order, limit) => {
    try {
        const options = {
            where: values,
            limit: limit,
            order: order
        };

        let result = await objTable.findAll(options);
        let result_code = (result == null) ? false : true;
        return utils.convertToApiResult(result_code, result);

    } catch (error) {
        logger.error(req.rowId, error.stack);
    
        return utils.convertToApiResult(false, error.message);
    }
};

const dbSelectOne = async (req, objTable, values) => {
    try {
        const options = {
            where: values
        };

        let result = await objTable.findOne(options);
        let result_code = (result == null) ? false : true;
        return utils.convertToApiResult(result_code, result);

    } catch (error) {
        logger.error(req.rowId, error.stack);
    
        if (transaction) {
          await transaction.rollback();
        }

        return utils.convertToApiResult(false, error.message);
    }
};

const dbCount = async (req, objTable, values) => {
    try {
        const options = {
            where: values
        };
        let result = await objTable.count(options);
        let result_code = (result == null) ? false : true;
        return utils.convertToApiResult(result_code, result);

    } catch (error) {
        logger.error(req.rowId, error.stack);

        return utils.convertToApiResult(false, error.message)
    }
}

module.exports = {
    dbInsert,
    dbSelectAll,
    dbSelectOne,
    dbCount
};