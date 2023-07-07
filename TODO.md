## TODO list


DONE:
1. Per server configuration of events/addresses/blocks to "follow"
   - /follow <events ==> transfer/approval/approvalforall/all> <value>
   - /unfollow <value>

2. Configuration management of the above
   - /config <add/remove> <events ==> transfer/approval/approvalforall/all>
     <address>
   - /config <list>

TODO:
3. Data display (charts, tables, etc)
   - /data <address> <interval> <value ==> chart/table>

4. Data export (csv, json, etc)
   - /export <address> <events ==> transfer/approval/approvalforall/all> <value
     ==> csv/json>

5. NFT metadata explorer
   - /nft <address> <token_id>
