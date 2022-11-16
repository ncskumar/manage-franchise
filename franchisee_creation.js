const {connectAndExecQuery, getDataFromDb}=require('./dbconnect')
const envHostUrlMapping={
    TEST_CMS_3: testcms3.numocity.in
}

const franchiseCreation=async(environment, cpName, franchiseNameUrl, ChargeStationIDData, adminEmail)=>{
    const hosturl= envHostUrlMapping[environment];
    const franchiseData=findFranchiseName(franchiseNameUrl);
    const ChargeStationID=parseInt(ChargeStationIDData)
    const assetChangesResp=await assetChanges(hosturl,cpName, franchiseData, ChargeStationID)
    if(assetChangesResp?.error){
        console.log(assetChangesResp.error);
        return {error: assetChangesResp.error}
    }

    const notificationChangesResp=await notificationChanges(hosturl, franchiseData)
    if(notificationChangesResp?.error){
        console.log(notificationChangesResp.error);
        return {error: assetChangesResp.error}
    }

    userChangesResp=await userChanges(hosturl, adminEmail, franchiseData)
    if(userChangesResp.error){
        console.log(userChangesResp?.error);
        return {error: assetChangesResp.error}
    }
    return ({response:'success'})
}
const assetChanges=async (hosturl,cpName, franchiseData, ChargeStationID)=>{
    // sql connection obj
    const mysqlObj={
        host: hosturl,
        port: process.env.assetPort,
        password: process.env.password,
        user: process.env.user,
        database: 'assetdb',
    };
    const franchiseName=franchiseData.franchiseName;
    // finding cpId from chargepoint table
    let queryOps=`SELECT * FROM chargepoint_table WHERE ChargePointName=?`;
    let queryData=[cpName]
    const response= await getDataFromDb(queryOps, queryData, mysqlObj)
    const franchiseCpMapping={
        ChargePointID:response[0].ChargePointID,
        FranchiseChain: franchiseData.franchiseUrl,
    }
    if(response.error|| response.length!=1){
        return {error:'error fetching cpId'}
    }
    // insert ChargePointID, FranchiseChain in franchise_cp_mapping
    queryOps=`INSERT INTO franchise_cp_mapping SET ?`;
    const franchiseCpMappingResp=await connectAndExecQuery(queryOps, franchiseCpMapping, mysqlObj)
    if(franchiseCpMappingResp.error){
        return {error:franchiseCpMappingResp.error}
    }
    // update franchise name and charge station id chargestation_table
    queryOps= `UPDATE assetdb.chargestation_table SET FranchaiseName=? WHERE ChargeStationID=?`
    queryData= [franchiseName,1];
    const chargestationTableMapping=await connectAndExecQuery(queryOps, queryData, mysqlObj)
    if(chargestationTableMapping.error){
        return {error:chargestationTableMapping.error}
    }
    return {message: 'asset Changes done'}
}

const notificationChanges= async(hosturl,franchiseData)=>{
    const mysqlObj={
        host: hosturl,
        port: process.env.notificationPort,
        password: process.env.password,
        user: process.env.user,
        database: 'notificationdb',
    };
    const notificationData={
        CompanyName:'TO DO',
        CompanyLog:'TO DO',
        CompanyAddress: 'TO DO',
        CompanyGSTN: 'TO DO',
        CompanyPAN: 'TO DO',
        CompanyTagLine: 'TO DO',
        CreatedOn: new Date(),
        FranchaiseName: franchiseData.franchiseName,
        IsDefault: 0,
    }
    // insert data in to email_info_table
    const queryOps=`INSERT INTO email_info_table SET ?`;
    const emailInfo=await connectAndExecQuery(queryOps, notificationData, mysqlObj)
    if(emailInfo.error){
        return {error:emailInfo.error}
    }
    return {message: 'notification Changes done'}
}

const userChanges= async(hosturl, adminEmail, franchiseData)=>{
    const franchiseName=franchiseData.franchiseName;
    const mysqlObj={
        host: hosturl,
        port: process.env.userPort,
        password: process.env.password,
        user: process.env.user,
        database: 'userdb',
    };

    //get admin Id from email
    let queryOps=`SELECT * FROM admin_table WHERE AdminEmail=?`;
    let queryData=[adminEmail]
    const response= await getDataFromDb(queryOps, queryData, mysqlObj)
    const adminId=response[0].AdminID;
    //update charge station table
    queryOps= `UPDATE admin_table SET Franchise=? WHERE AdminID= ?`
    queryData= [franchiseName, adminId];
    const chargeStationTableResp=await connectAndExecQuery(queryOps, queryData, mysqlObj)
    if(chargeStationTableResp.error){
        return {error:chargeStationTableResp.error}
    }
    return {message: 'user Changes done'}
}

const findFranchiseName=(franchiseUrl)=>{
    let franchiseData = franchiseUrl.split("/");
    const franchiseUrlData={
        franchiseName: franchiseData[2],
        franchiseUrl
    }
    if(franchiseUrl.length-1 != '/'){
        franchiseUrlData.franchiseUrl=`${franchiseUrl}/`
    }
    return franchiseUrlData
}


var arguments = process.argv
const hosturl=arguments[2];
const cpName=arguments[3];
const franchiseName=arguments[4];
const ChargeStationID=arguments[5];
const adminEmail=arguments[6];
franchiseCreation(hosturl, cpName, franchiseName, ChargeStationID, adminEmail)
