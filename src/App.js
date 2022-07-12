import { useState, useEffect } from 'react';
import './App.css';
import Axios from 'axios'
import { Button, Row, Col, Container, Form, Card, Table } from 'react-bootstrap';

const baseUrl = 'http://localhost:3333'
function getStatus(el) {
  switch (el.status) {
    case 'INIT':
      return 'Init';
    case 'DONE':
      return 'Done';
    case 'BTC_SENT':
      return `Bitcoin Sent (#${el.blockchainConfirmations} confirmations)`;
    default:
      return el.status
  }
}

function App() {
  const [paymentStatus, setPaymentStatus] = useState();
  const [btcPrice, setBtcPrice] = useState(null);
  const [usdValue, setUsdValue] = useState(0);
  const [addressInvalid, setAddressInvalid] = useState();
  const [btcBalance, setBtcBalance] = useState();
  const [refreshKey, setRefreshKey] = useState(0);
  const [orders, setOrders] = useState()

  const [working, setWorking] = useState(true)
  useEffect(() => {
    Axios.get(baseUrl + "/btc-price").then((btcPriceResp) => {
      setBtcPrice(btcPriceResp.data.btcPrice)
      Axios.get(baseUrl + "/balance").then((balanceResp) => {
        setBtcBalance(balanceResp.data.balance)
        Axios.get(baseUrl + "/order").then((resp) => {
          setOrders(resp.data)
          setWorking(false)
          console.log(resp.data)
        })
      })
    })
  }, [refreshKey])

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const omiseAmount = (+usdValue) * 100;
    console.log(data)
    const createOrderResp = (await Axios.post(baseUrl + "/order", {
      btcAmount: +(data.btcAmount),
      usdAmount: usdValue,
      address: data.address,
    }));

    console.log('create order response', createOrderResp);

    const { OmiseCard } = window


    OmiseCard.configure({
      publicKey: createOrderResp.data.omisePublicKey,
      amount: omiseAmount,
    })

    OmiseCard.open({
      amount: omiseAmount,
      currency: "USD",
      defaultPaymentMethod: "credit_card",
      onCreateTokenSuccess: async (nonce) => {
        if (nonce.startsWith("tokn_")) {
          await Axios.post(baseUrl + "/charge", {
            omiseToken: nonce,
            orderId: createOrderResp.data.id,
          });
          setPaymentStatus('verification')
          setRefreshKey(key => key + 1)
        }
      }
    })
  }

  const validateAddress = (e) => {
    console.log(e.target.value)
    Axios.get(`${baseUrl}/validate-address/${e.target.value}`).then((resp) => {
      console.log(resp.status)
      setAddressInvalid(false)
      setRefreshKey(key => key + 1)
    }).catch((e) => setAddressInvalid(true))
  }

  const amountChange = (e) => {
    const value = parseFloat(e.target.value) * btcPrice;
    setUsdValue(value.toFixed(2))
  }
  return (
    <div className="App">
      <Container>
        <Row className='top-space'>
          <Col>
            <Card className='btc-header'>
              <h3>Price for 1 BTC</h3> <h1>{(btcPrice === null) ? "" : (`${btcPrice} USD`)}</h1>
            </Card>
          </Col>
          <Col>
            <Card className='btc-header'>
              <h3>In Stock</h3> <h1>{(btcBalance === null) ? "" : (`${btcBalance} Bitcoin`)}</h1>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form onSubmit={handleSubmit}>
              <Form.Label>Enter destination Bitcoin Address</Form.Label>
              <Form.Control className={addressInvalid ? 'is-invalid' : ''} name="address" type="text" onBlur={validateAddress} ></Form.Control>
              <div hidden={!addressInvalid} className="invalid-feedback">
                Address invalid
              </div>
              <Form.Label>Enter Amount</Form.Label>
              <Form.Control onChange={amountChange} name="btcAmount" type="text"></Form.Control>
              <Button disabled={isNaN(usdValue) || usdValue === 0 || working == true} className="btn btn-primary top-space" type="submit">Pay {usdValue > 0 ? `${usdValue} USD` : ""}</Button>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            {paymentStatus === 'verification' ? (<Col>Payment Verification</Col>) : ""}
            {paymentStatus === 'success' ? (<Col>Payment Successful</Col>) : ""}
            {paymentStatus === 'failed' ? (<Col>Payment Failed</Col>) : ""}
          </Col>
        </Row>
        <Row>
          <Col><h4 className='top-space'>Recent Transactions</h4></Col>
        </Row>
        <Row>
          <Col>
            <Table className='top-space' striped bordered hover>
              <thead>
                <tr>
                  <th>BTC</th>
                  <th>Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((val, key) => {
                  return (
                    <tr key={key}>
                      <td>{val.btcAmount}</td>
                      <td>{val.address}</td>
                      <td>{getStatus(val)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
