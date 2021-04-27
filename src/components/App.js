import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentDidMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
    await this.loadContract()
  }

  // Blockchain/web3 loading methods
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
    const contract = new window.web3.eth.Contract(abi, address)
    this.setState({ contract })

    await this.loadImages()
  }

  async loadImages() {
    const imagesCount = await this.state.contract.methods.imageCount().call()
    this.setState({ imagesCount })

    for (var i = 1; i <= imagesCount; i++) {
      const image = await this.state.contract.methods.images(i).call()
      this.setState({
        images: [...this.state.images, image]
      })
    }

    this.setState({
      images: this.state.images.sort((a,b) => b.tipAmount - a.tipAmount)
    })

    this.setState({ loading: false })
  }

  // Image Upload methods
  captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
    }
  }

  uploadImage = description => {
    console.log("Submitting file to ipfs...")
    
    ipfs.add(this.state.buffer, (error, result) => {
      console.log("IPFS result", result)
      if (error) {
        console.error(error)
        return
      }

      this.setState({loading: true})
      this.state.contract.methods.uploadImage(result[0].hash, description)
        .send({ from: this.state.account })
        .on('transactionHash', (hash) => {
          this.setState({ loading: false })
        })
    })
  }

  tipImageOwner = (id, tipAmount) => {
    this.setState({ loading: true })
    this.state.contract.methods.tipImageOwner(id)
      .send({ from: this.state.account, value: tipAmount})
      .on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      contract: null,
      imageCount: 0,
      images: [],
      loading: true
    }
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              captureFile={this.captureFile}
              uploadImage={this.uploadImage}
              tipImageOwner={this.tipImageOwner}
              images={this.state.images}
            />
        }
      </div>
    );
  }
}

export default App;