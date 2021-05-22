# chia-node-list-api

## General API Information
* The base endpoint is: https://chia-node-list-api.vercel.app/
* All endpoints return either a JSON object

## HTTP Return Codes
* HTTP `4xx` return codes are used for malformed requests; the issue is on the sender's side
* HTTP `5xx` return codes are used for internal error; the issue is on server side

## API Endpoints
### Node List
```
GET /node
```
Get node list

**Parameters:**
|Name|Type|Mandatory|Description|
|----|----|:-------:|-----------|
|limit|int|NO|Default 100; max 1000.|

### Insert Node
```
POST /node
```
insert node

**Parameters:**
|Name|Type|Mandatory|Description|
|----|----|:-------:|-----------|
|node_ip|str|YES|Ip Address Node|
|node_port|int|YES|Port Node|

### Active Node
```
PATCH /node
```
active node

**Parameters:**
|Name|Type|Mandatory|Description|
|----|----|:-------:|-----------|
|node_ip|str|YES|Ip Address Node|
|node_port|int|YES|Port Node|

### Active or Insert Node
```
PUT /node
```

**Parameters:**
|Name|Type|Mandatory|Description|
|----|----|:-------:|-----------|
|node_ip|str|YES|Ip Address Node|
|node_port|int|YES|Port Node|