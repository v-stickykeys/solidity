import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { fail } from "assert";

describe.only("PullPaymentSplitter", () => {
    let contract: Contract;
    let recipients: Array<String>;
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
        const Contract = await ethers.getContractFactory("PullPaymentSplitter");
        contract = await Contract.deploy(
            recipients,
            percentages
        );
    });

    describe("deposit", () => {
        it("assigns amount of Ether to each recipient based on percentage", async () => {
            let tx = await contract.deposit({value: BigNumber.from(100)});
            await tx.wait();
            for (let index = 0; index < recipients.length; index++) {
                expect(
                    await contract.payments(recipients[index]),
                    "Recipient is eligible for wei"
                ).to.equal(percentages[index]);   
            }
        });
        it("assigns change to recipients when division rounds towards 0", async () => {
            let tx = await contract.deposit({value: BigNumber.from(10)});
            await tx.wait();
            
            expect(
                await contract.payments(recipients[0]),
                "Aloe is eligible for 3 wei"
            ).to.equal(percentages[0].div(10));
            const aloeChange = await contract.changeByRecipient(recipients[0]);
            expect(
                aloeChange,
                "Aloe is eligible for 0/100 change"
            ).to.equal(BigNumber.from(0));

            expect(
                await contract.payments(recipients[1]),
                "Bill is eligible for 1 wei"
            ).to.equal(percentages[1].div(10));
            const billChange = await contract.changeByRecipient(recipients[1]);
            expect(
                billChange,
                "Bill is eligible for 0/100 change"
            ).to.equal(BigNumber.from(0));

            expect(
                await contract.payments(recipients[2]),
                "Cate is not yet eligible for wei"
            ).to.equal(BigNumber.from(0));
            const cateChange = await contract.changeByRecipient(recipients[2]);
            expect(
                cateChange,
                "Cate is eligible for 60/100 change"
            ).to.equal(BigNumber.from(60));

            expect(
                await contract.payments(recipients[3]),
                "Dane is eligible for 5 wei"
            ).to.equal(BigNumber.from(5));
            const daneChange = await contract.changeByRecipient(recipients[3]);
            expect(
                daneChange,
                "Dane is eligible for 40/100 change"
            ).to.equal(BigNumber.from(40));

            expect(
                await ethers.provider.getBalance(contract.address),
                "Contract holds balance for change"
            ).to.equal(aloeChange.add(billChange.add(cateChange.add(daneChange))).div(100));
        });
    });
    describe("transferChange", async () => {
        it("reverts if not enough change is acculumated", async () => {
            fail();
        });
        it("assigns amount of Ether when enough change is accumulated", async () => {
            fail();
        });
    });
});
