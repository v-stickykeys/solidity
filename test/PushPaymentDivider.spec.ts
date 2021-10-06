import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";

describe("PushPaymentDivider", () => {
    let contract: Contract;
    let recipients: Array<string>;
    let percentages: Array<BigNumber>;
    
    beforeEach(async () => {
        const [deployer, aloe, bill, cate, dane] = await ethers.getSigners();
        recipients = [
            aloe.address,
            bill.address,
            cate.address,
            dane.address
        ];
        percentages = [
            BigNumber.from(30),
            BigNumber.from(10),
            BigNumber.from(6),
            BigNumber.from(54)
        ];
        const Contract = await ethers.getContractFactory("PushPaymentDivider");
        contract = await Contract.deploy(
            recipients,
            percentages
        );
    });

    describe("deposit", () => {
        it("sends amount of Ether to each recipient based on percentage", async () => {
            let startingBalances = await Promise.all(recipients.map((recipient) => {
                return ethers.provider.getBalance(recipient);
            }));
            let tx = await contract.deposit({value: BigNumber.from(100)});
            await tx.wait();
            let endingBalances = await Promise.all(recipients.map((recipient) => {
                return ethers.provider.getBalance(recipient);
            }));
            for (let index = 0; index < endingBalances.length; index++) {
                expect(
                    endingBalances[index].sub(startingBalances[index]),
                    "Recipient receives percentage of deposit"
                ).to.equal(percentages[index]);   
            }
        });
        it("assigns change to recipients when division rounds towards 0", async () => {
            let startingBalances = await Promise.all(recipients.map((recipient) => {
                return ethers.provider.getBalance(recipient);
            }));
            let tx = await contract.deposit({value: BigNumber.from(10)});
            await tx.wait();
            let endingBalances = await Promise.all(recipients.map((recipient) => {
                return ethers.provider.getBalance(recipient);
            }));

            expect(
                endingBalances[0].sub(startingBalances[0]),
                "Aloe received 3 wei"
            ).to.equal(percentages[0].div(10));
            const aloeChange = await contract.accumulatedChange(recipients[0]);
            expect(
                aloeChange,
                "Aloe is eligible for 0/100 change"
            ).to.equal(BigNumber.from(0));

            expect(
                endingBalances[1].sub(startingBalances[1]),
                "Bill received 1 wei"
            ).to.equal(percentages[1].div(10));
            const billChange = await contract.accumulatedChange(recipients[1]);
            expect(
                billChange,
                "Bill is eligible for 0/100 change"
            ).to.equal(BigNumber.from(0));

            expect(
                endingBalances[2].sub(startingBalances[2]),
                "Cate has not yet received wei"
            ).to.equal(BigNumber.from(0));
            const cateChange = await contract.accumulatedChange(recipients[2]);
            expect(
                cateChange,
                "Cate is eligible for 60/100 change"
            ).to.equal(BigNumber.from(60));

            expect(
                endingBalances[3].sub(startingBalances[3]),
                "Dane received 5 wei"
            ).to.equal(BigNumber.from(5));
            const daneChange = await contract.accumulatedChange(recipients[3]);
            expect(
                daneChange,
                "Dane is eligible for 40/100 change"
            ).to.equal(BigNumber.from(40));

            expect(
                await ethers.provider.getBalance(contract.address),
                "Contract holds balance for change"
            ).to.equal(aloeChange.add(billChange.add(cateChange.add(daneChange))).div(100));
        });
        it("sends amount of Ether when enough change is accumulated", async () => {
            const cateAddress = recipients[2];

            const cateBalance1 = await ethers.provider.getBalance(cateAddress);
            const contractBalance1 = await ethers.provider.getBalance(contract.address);

            let tx = await contract.deposit({value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance2 = await ethers.provider.getBalance(cateAddress);
            const contractBalance2 = await ethers.provider.getBalance(contract.address);

            expect(
                cateBalance2.sub(cateBalance1),
                "Cate does not receive anything upon the first deposit"
            ).to.equal(BigNumber.from(0));
            expect(
                contractBalance2.sub(contractBalance1),
                "The contract stores the total change to later be divided amongst recipients"
            ).to.equal(BigNumber.from(1));

            tx = await contract.deposit({value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance3 = await ethers.provider.getBalance(cateAddress);
            const contractBalance3 = await ethers.provider.getBalance(contract.address);

            expect(
                cateBalance3.sub(cateBalance2),
                "The change over 100 gets transferred to Cate"
            ).to.equal(BigNumber.from(1));
            expect(
                contractBalance3.sub(contractBalance2),
                "Because Cate receives the payment from change the contract balance does not change"
            ).to.equal(BigNumber.from(0));

            expect(
                await contract.accumulatedChange(cateAddress),
                "Cate still has some change remaining"
            ).to.equal(BigNumber.from(20));
        });
    });
});
