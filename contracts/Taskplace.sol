// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
contract Taskplace{

    uint256 public orderId;
    uint256 public workId;

    mapping(address=>uint256) public orderIndexs;
    mapping(address=>mapping (uint256=>uint256)) public  orderIds;

    mapping(address=>uint256) public workerIndexs;
    mapping(address=>mapping (uint256=>uint256)) public workerIds;

    mapping(uint256=>order) public orders;
    mapping(uint256=>work) public works;

    mapping(uint256=>uint256[]) public orderWorkIds;
    mapping(uint256=>uint256[]) public qualifiedWorkIds;

    mapping(address=>uint256[]) public workerOrderIds;
    mapping(address=>uint256[]) public publisherOrderIds;

    uint256[] public data=[0,0,0,0];
    //0,deposited
    //1,rewarded
    //2,work_approved_count
    //3,work_rejected_count

    struct agent{
        address agentAddress;
        bool isRegister;
        bool agentState;
        uint256 approved;
        uint256 rejected;
        uint256 income;
        string metadata;
    }
    mapping(address=>agent) public agents;

    event orderEvent(
        uint256 indexed e_orderId,
        uint256 e_price,
        uint256 e_limit,
        string  e_description,
        address indexed e_publisher,
        uint256 indexed e_date,
        uint256 e_status);
    
    event workEvent(
        uint256 indexed e_workId,
        uint256 indexed e_orderId,
        string e_detail,
        address  indexed e_worker,
        uint256 e_status);

    event checkEvent(
        uint256 indexed e_orderId,
        uint256 indexed e_workId,
        bool e_approve
    );

    struct order{
        uint256 orderId;
        uint256 price;
        uint256 limit;
        string  description;
        address publisher;
        uint256 date;
        uint256 status; //0,1,2
    }

    struct work{
        uint256 workId;
        uint256 orderId;
        string detail;
        address worker;
        uint256 status; //0,1,2
    }

    function createOrder(uint256 _price,uint256 _limit,string memory _description) public payable {
        require(msg.value >= _price * _limit);
        orderIds[msg.sender][orderIndexs[msg.sender]]=orderId;
        orders[orderId]=order(orderId,_price,_limit,_description,msg.sender,block.timestamp,1);
        publisherOrderIds[msg.sender].push(orderId);
        emit orderEvent(orderId,_price,_limit,_description,msg.sender,block.timestamp,1);
        orderIndexs[msg.sender]++;
        orderId++;
        data[0]+=_price * _limit;
    }

    function createWork(uint256 _orderId,string memory _detail) public {
        require(orders[_orderId].status==1);
        workerIds[msg.sender][workerIndexs[msg.sender]]=workId;
        works[workId]=work(workId,_orderId,_detail,msg.sender,0); 
        orderWorkIds[_orderId].push(workId);
        workerOrderIds[msg.sender].push(_orderId);
        emit workEvent(_orderId, workId, _detail, msg.sender, 0);
        workerIndexs[msg.sender]++;
        workId++;
    }

    function checkWork(uint256 _workId, bool _approve)public {
        uint256  workOrderId=works[_workId].orderId;
        require(orders[workOrderId].publisher==msg.sender &&qualifiedWorkIds[workOrderId].length < orders[workOrderId].limit);
        if(_approve){
            works[_workId].status=1;
            qualifiedWorkIds[workOrderId].push(_workId);
            if(qualifiedWorkIds[workOrderId].length==orders[workOrderId].limit){
                orders[workOrderId].status=2;
            }
            uint256 reward=orders[works[_workId].orderId].price;
            payable(works[_workId].worker).transfer(reward);
            agents[works[_workId].worker].approved+=1;
            agents[works[_workId].worker].income+=reward;
            data[1]+=reward;
            data[2]+=1;
        }else{
            agents[works[_workId].worker].rejected+=1;
            works[_workId].status=2;
            data[3]+=1;
        }
        emit checkEvent(workOrderId, _workId, _approve);
    }

    function getWorkIds(uint256 _orderId)public view returns (uint256[] memory){
        return orderWorkIds[_orderId];
    }

    function getQualifiedWorkIds(uint256 _orderId)public view returns (uint256[] memory){
        return qualifiedWorkIds[_orderId];
    }

    function cancelOrder(uint256 _orderId)public {
        require(orders[_orderId].status==1&&orders[_orderId].publisher==msg.sender);
        orders[_orderId].status=0;
        payable(msg.sender).transfer(orders[_orderId].price*(orders[_orderId].limit-qualifiedWorkIds[_orderId].length));
    }

    function getOrderIdsByWorker(address _worker)public view returns (uint256[] memory){
        return workerOrderIds[_worker];
    }

    function getOrderIdsByPublisher(address _publisher)public view returns (uint256[] memory){
        return publisherOrderIds[_publisher];
    }


    function getOrdersByPage(uint256 _pageNum, uint256 _pageSize)
        public
        view
        returns (order[] memory)
    {
        if (orderId == 0) {
            order[] memory tempArray = new order[](0);
            return tempArray;
        } else {
            if (_pageNum > 1 && ((orderId - 1) / _pageSize) < (_pageNum - 1)) {
                order[] memory tempArray = new order[](0);
                return tempArray;
            } else {
                uint256 arrayLength;
                uint256 arrayIndex = 0;

                uint256 dataStart = (orderId - 1) - (_pageNum - 1) * _pageSize;
                uint256 dataEnd;

                if (dataStart < _pageSize) {
                    dataEnd = 0;
                    arrayLength = dataStart + 1;
                } else {
                    dataEnd = dataStart - _pageSize + 1;
                    arrayLength = _pageSize;
                }

                order[] memory returnArray = new order[](arrayLength);

                for (int256 i = int256(dataStart); i >= int256(dataEnd); i--) {
                    returnArray[arrayIndex] = orders[uint256(i)];
                    arrayIndex++;
                }
                return returnArray;
            }
        }
    }


    function updateWorker(bool _state,string memory _metadata)public {
        agent memory worker=agents[msg.sender];
        if(!worker.isRegister){
            worker.agentAddress=msg.sender;
            worker.isRegister=true;
        }
        worker.agentState=_state;
        worker.metadata=_metadata;
        agents[msg.sender]=worker;
    }

    function getData()public view returns(uint256[] memory){
        uint256 [] memory returnData=new uint256[](6);
        returnData[0]=data[0];
        returnData[1]=data[1];
        returnData[2]=data[2];
        returnData[3]=data[3];
        returnData[4]=orderId;
        returnData[5]=workId;
        return returnData;
    }

  



}