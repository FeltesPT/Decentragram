import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'


class App extends Component {

  async componentDidMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
    await this.loadContract()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non-Ethereum browser detected. You should consider installing MetaMask!')
    }
  }

  async loadBlockchainData() {
    const accounts = await window.web3.eth.getAccounts()
    this.setState({
      account: accounts[0]
    })
  }

  async loadContract() {
    const networkId = await window.web3.eth.net.getId()
    const networkData = Decentragram.networks[networkId]
    if (networkData) {
      this.loadContractData(networkData)
    } else {
      alert ('Smart contract not deployed to detected network')
    }
  }

  async loadContractData(networkData) {
    const abi = Decentragram.abi
    const address = networkData.address
    const token = new window.web3.eth.Contract(abi, address)
    this.setState({ token })

    
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
    }
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
            // Code...
            />
          }
        }
      </div>
    );
  }
}

export default App;