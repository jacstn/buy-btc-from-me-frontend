import { useState, useEffect } from 'react';
import './App.css';
import Axios from 'axios'
import { Button, Row, Col, Container, Form, Card } from 'react-bootstrap';

const baseUrl = 'http://localhost:3333'

function App() {
  const [omisePaymentToken, setOmisePaymentToken] = useState()
  const [paymentStatus, setPaymentStatus] = useState();
  const [btcAddress, setBtcAddress] = useState(10000);
  const [btcPrice, setBtcPrice] = useState(null);
  const [usdValue, setUsdValue] = useState(0);
  const [addressInvalid, setAddressInvalid] = useState();
  const [btcBalance, setBtcBalance] = useState();

  useEffect(() => {
    Axios.get(baseUrl + "/btc-price").then((resp) => {
      setBtcPrice(resp.data.btcPrice)
    })

    Axios.get(baseUrl + "/balance").then((resp) => {
      setBtcBalance(resp.data.balance)
    })
  }, [])

  async function pay() {
    const createOrderResp = await Axios.post(baseUrl + "/order", {
      amount: 123,
      address: "23423423423423"
    });
    console.log('create order response', createOrderResp)
    const { OmiseCard } = window
    OmiseCard.configure({
      publicKey: createOrderResp.data.omisePublicKey,
      amount: btcAddress
    })

    OmiseCard.open({
      amount: btcAddress,
      currency: "USD",
      defaultPaymentMethod: "credit_card",
      onCreateTokenSuccess: (nonce) => {
        console.log("omise payment gateway response:", nonce)
        if (nonce.startsWith("tokn_")) {
          setOmisePaymentToken(nonce);
        }
      }
    })
  }

  const validateAddress = (e) => {
    console.log(e.target.value)
    Axios.get(`${baseUrl}/validate-address/${e.target.value}`).then((resp) => {
      console.log(resp.status)
      setAddressInvalid(false)
    }).catch((e) => setAddressInvalid(true))
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
  }

  const amountChange = (e) => {
    const value = parseFloat(e.target.value) * btcPrice;
    setUsdValue(value.toFixed(2))
  }
  return (
    <div className="App">
      <Container>
        <Row>
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
              <Form.Control onChange={amountChange} name="amount" type="text"></Form.Control>
              <Button disabled={isNaN(usdValue) || usdValue === 0} className="btn btn-primary pay-button" type="submit">Pay {usdValue > 0 ? `${usdValue} USD` : ""}</Button>
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
      </Container>
    </div>
  );
}

export default App;
