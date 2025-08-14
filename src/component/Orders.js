import "./Orders.css";
import { formatEther, parseEther } from "viem";
import { useEffect, useState } from "react";
import { Pagination, ConfigProvider, Input, InputNumber, Modal } from "antd";
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  getChainId,
  getChains,
  getAccount,
} from "@wagmi/core";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import config from "../config";
import abi from "../abi.json";
import { mode } from "viem/chains";

function Orders() {
  const [orders, setOrders] = useState([]);

  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const [pageTotal, setPageTotal] = useState(1);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [limit, setLimit] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modelDetail, setModelDetail] = useState({});
  const [works, setWorks] = useState([]);

  useEffect(() => {
    async function fetchData() {
      await getPageTotal();
      await queryOrder(pageNum, pageSize);
    }
    fetchData();
  }, []);

  const timeAgo = (timestamp) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp * 1000) / 1000); // 秒差值
    if (diff < 60) {
      return `${diff}s ago`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}h ago`;
    } else {
      return `${Math.floor(diff / 86400)}d ago`;
    }
  };

  const getPageTotal = async () => {
    const total = await readContract(config, {
      address: config.chains[0].contracts.orders,
      abi: abi,
      functionName: "orderId",
      args: [],
    });

    setPageTotal(parseInt(total));
  };

  const queryOrder = async (_pageNum, _pageSize) => {
    const orders = await readContract(config, {
      address: config.chains[0].contracts.orders,
      abi: abi,
      functionName: "getOrdersByPage",
      args: [_pageNum, _pageSize],
    });

    let newOrders = [];
    for (let item of orders) {
      newOrders.push({
        id: item.orderId.toString(),
        detail: item.description,
        amount: item.limit.toString(),
        price: formatEther(item.price.toString()),
        publisher: item.publisher,
        status: parseInt(item.status),
        date: timeAgo(item.date.toString()),
      });
    }
    setOrders(newOrders);
    setPageNum(_pageNum);
  };

  const changePageNum = (_pageNum, _pageSize) => {
    queryOrder(_pageNum, _pageSize);
  };

  const createOrder = async () => {
    const txhash = await writeContract(config, {
      address: config.chains[0].contracts.orders,
      abi: abi,
      value: parseEther((price * limit).toString()),
      functionName: "createOrder",
      args: [parseEther(price.toString()), limit, description],
    });
    const transactionReceipt = await waitForTransactionReceipt(config, {
      hash: txhash,
    });
    await getPageTotal();
    await queryOrder(1, pageSize);
    setDescription("");
    setPrice("");
    setLimit("");
  };

  const getWorksByOrder=async(index)=>{

    setModelDetail(orders[index]);

    const workIds=await readContract(config, {
      address: config.chains[0].contracts.orders,
      abi: abi,
      functionName: "getWorkIds",
      args: [orders[index].id],
    });


    let works=[];
    for(let id of workIds){
      let work=await readContract(config, {
        address: config.chains[0].contracts.orders,
        abi: abi,
        functionName: "works",
        args: [id],
      });
      
      works.push({
        id:work[0].toString(),
        worker:work[3],
        status:parseInt(work[4]),
        detail:work[2],
      });
    }

    setWorks(works);

 
  
  }


  return (
    <div className="Orders">
      <ConfigProvider
        theme={{
          components: {
            Modal: {
              contentBg: "#1D1D1D",
              headerBg: "#1D1D1D",
              titleColor: "#fff",
            },
            Input: {
              hoverBg: "#000",
              activeBg: "#000",
            },
          },
          token: {
            colorBgMask: "rgba(0, 0, 0, 0.7)",
            colorIcon: "#fff",
            colorIconHover: "#fff",
            colorTextPlaceholder: "#4B4B4B",
          },
        }}
      >
        <Modal
          style={{
            top: 100,
          }}
          width={600}
          destroyOnHidden={true}
          title="Order Detail"
          open={showModal}
          maskClosable={false}
          footer={null}
          onCancel={() => {
            setShowModal(false);
          }}
        >
        
            {orders.length!=0?(<div className="model_order">
                <div className="model_order_id">Order ID: {modelDetail.id}</div>
                <div className="model_order_detail">Order {modelDetail.detail}</div>
                
                <div className="model_order_publisher">Publisher: {modelDetail.publisher}</div>
                <div className="model_order_price">Price: {modelDetail.price}ETH</div>
                <div className="model_order_amount">Amount: {modelDetail.amount}</div>
                <div className="model_order_date">Date: {modelDetail.date}</div>
                <div className="model_order_status">Status: {modelDetail.status}</div>

                <ul>
                    {works.map((item,index)=>{
                        return(
                            <li key={index}>
                                <div>Work ID: {item.id}</div>
                                <div>Worker: {item.worker}</div>
                                <div>Status: {item.status}</div>
                                <div>Detail: {item.detail}</div>
                            </li>
                        )
                    })}
             
                </ul>

            </div>):(
                <div></div>
            )}

        </Modal>
      </ConfigProvider>

      <ul className="order_list">
        {orders.map((item, index) => (
          <li key={index}>
            <p className="order_info two_line_ellipsis" onClick={() => {
             
              getWorksByOrder(index);
              setShowModal(true);
            }}>{item.detail}</p>

            <p className="order_price">{item.price}ETH</p>

            <p className="order_amount">{item.amount}</p>

            <p className="order_date">{item.date}</p>
          </li>
        ))}
      </ul>
      <div className="order_page">
        <ConfigProvider
          theme={{
            token: {
              colorText: "#fff",
            },
          }}
        >
          <Pagination
            current={pageNum}
            simple={{
              readOnly: true,
            }}
            defaultCurrent={pageNum}
            defaultPageSize={pageSize}
            total={pageTotal}
            onChange={changePageNum}
          />
        </ConfigProvider>
      </div>
      <div className="createOrder">
        <ConfigProvider
          theme={{
            token: {
              colorBgContainer: "#202225",
              activeShadow: "#000",
            },
          }}
        >
          <Input.TextArea
            showCount
            maxLength={300}
            className="description_input_bg"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write something..."
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
          <div className="price_limit_input_box">
            <div className="price_limit_input">
              <InputNumber
                placeholder="Price"
                controls={false}
                className="price_input_bg"
                type="number"
                suffix="Sei"
                value={price}
                onChange={(e) => setPrice(e)}
              />
              <div style={{ width: 20 }}></div>
              <InputNumber
                placeholder="Amount"
                controls={false}
                className="limit_input_bg"
                type="number"
                value={limit}
                onChange={(e) => setLimit(e)}
              />
            </div>
            <div className="create_order_btn" onClick={createOrder}>
              Create
            </div>
          </div>
        </ConfigProvider>
      </div>
    </div>
  );
}

export default Orders;
