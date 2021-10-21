import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";

describe("FlexPaymentDivider Usage", () => {
    let contract: Contract;
    let recipients: Array<string>;
    let percentages: Array<BigNumber>;
    let paymentHandler: Contract;
    
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
        const Contract = await ethers.getContractFactory(
            "FlexPaymentDividerTest"
        );
        contract = await Contract.deploy(
            recipients,
            percentages
        );
        const paymentHandlerAddress = await contract.paymentHandler();
        paymentHandler = await ethers.getContractAt(
            "FlexPaymentDivider",
            paymentHandlerAddress
        );
    });

    it("paymentHandler sets recipients and percentages", async () => {
        const recipientCount = await paymentHandler.recipientCount();
        expect(
            recipientCount,
            "Recipient count matches number of addresses input upon deployment"
        ).to.equal(recipients.length);

        let recipientsById = await Promise.all(recipients.map((recipient, id) => {
            return paymentHandler.recipientById(id);
        }));
        for (let index = 0; index < recipientsById.length; index++) {
            expect(
                recipients[index],
                "Recipient ids correspond to order they were input upon deployment"
            ).to.equal(recipientsById[index]);
        }

        let percentagesByRecipient = await Promise.all(recipients.map((recipient) => {
            return paymentHandler.percentage(recipient);
        }));
        for (let index = 0; index < percentagesByRecipient.length; index++) {
            expect(
                percentages[index],
                "Recipient percentages correspond to order they were input upon deployment"
            ).to.equal(percentagesByRecipient[index]);
        }
    });

    describe("deposit (without safe mode)", () => {
        const safeMode = 0;
        it("sends amount of Ether to each recipient based on percentage", async () => {
            let startingBalances = await Promise.all(recipients.map((recipient) => {
                return ethers.provider.getBalance(recipient);
            }));
            let tx = await contract.deposit(safeMode, {value: BigNumber.from(100)});
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
            let tx = await contract.deposit(safeMode, {value: BigNumber.from(10)});
            await tx.wait();
            let endingBalances = await Promise.all(recipients.map((recipient) => {
                return ethers.provider.getBalance(recipient);
            }));

            expect(
                endingBalances[0].sub(startingBalances[0]),
                "Aloe received 3 wei"
            ).to.equal(percentages[0].div(10));
            const aloeChange = await paymentHandler.accumulatedChange(recipients[0]);
            expect(
                aloeChange,
                "Aloe is eligible for 0/100 change"
            ).to.equal(BigNumber.from(0));

            expect(
                endingBalances[1].sub(startingBalances[1]),
                "Bill received 1 wei"
            ).to.equal(percentages[1].div(10));
            const billChange = await paymentHandler.accumulatedChange(recipients[1]);
            expect(
                billChange,
                "Bill is eligible for 0/100 change"
            ).to.equal(BigNumber.from(0));

            expect(
                endingBalances[2].sub(startingBalances[2]),
                "Cate has not yet received wei"
            ).to.equal(BigNumber.from(0));
            const cateChange = await paymentHandler.accumulatedChange(recipients[2]);
            expect(
                cateChange,
                "Cate is eligible for 60/100 change"
            ).to.equal(BigNumber.from(60));

            expect(
                endingBalances[3].sub(startingBalances[3]),
                "Dane received 5 wei"
            ).to.equal(BigNumber.from(5));
            const daneChange = await paymentHandler.accumulatedChange(recipients[3]);
            expect(
                daneChange,
                "Dane is eligible for 40/100 change"
            ).to.equal(BigNumber.from(40));

            expect(
                await ethers.provider.getBalance(paymentHandler.address),
                "paymentHandler holds balance for change"
            ).to.equal(aloeChange.add(billChange.add(cateChange.add(daneChange))).div(100));
        });
        it("sends amount of Ether when enough change is accumulated", async () => {
            const cateAddress = recipients[2];

            const cateBalance1 = await ethers.provider.getBalance(cateAddress);
            const contractBalance1 = await ethers.provider.getBalance(paymentHandler.address);

            let tx = await contract.deposit(safeMode, {value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance2 = await ethers.provider.getBalance(cateAddress);
            const contractBalance2 = await ethers.provider.getBalance(paymentHandler.address);

            expect(
                cateBalance2.sub(cateBalance1),
                "Cate does not receive anything upon the first deposit"
            ).to.equal(BigNumber.from(0));
            expect(
                contractBalance2.sub(contractBalance1),
                "The paymentHandler stores the total change to later be divided amongst recipients"
            ).to.equal(BigNumber.from(1));

            tx = await contract.deposit(safeMode, {value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance3 = await ethers.provider.getBalance(cateAddress);
            const contractBalance3 = await ethers.provider.getBalance(paymentHandler.address);

            expect(
                cateBalance3.sub(cateBalance2),
                "The change over 100 gets transferred to Cate"
            ).to.equal(BigNumber.from(1));
            expect(
                contractBalance3.sub(contractBalance2),
                "Because Cate receives the payment from change the contract balance does not change"
            ).to.equal(BigNumber.from(0));

            expect(
                await paymentHandler.accumulatedChange(cateAddress),
                "Cate still has some change remaining"
            ).to.equal(BigNumber.from(20));
        });
    });

    describe("deposit (safe mode)", () => {
        const safeMode = 1;
        it("holds balance of Ether for each recipient based on percentage", async () => {
            let startingBalances = await Promise.all(recipients.map((recipient) => {
                return paymentHandler.accumulatedBalance(recipient);
            }));
            const value = BigNumber.from(100);
            let tx = await contract.deposit(safeMode, {value});
            await tx.wait();
            expect(
                await ethers.provider.getBalance(paymentHandler.address),
                "Payment handler holds balance"
            ).to.equal(value);
            let endingBalances = await Promise.all(recipients.map((recipient) => {
                return paymentHandler.accumulatedBalance(recipient);
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
                return paymentHandler.accumulatedBalance(recipient);
            }));
            const value = BigNumber.from(10);
            let tx = await contract.deposit(safeMode, {value});
            await tx.wait();
            expect(
                await ethers.provider.getBalance(paymentHandler.address),
                "Payment handler holds balance"
            ).to.equal(value);
            let endingBalances = await Promise.all(recipients.map((recipient) => {
                return paymentHandler.accumulatedBalance(recipient);
            }));

            expect(
                endingBalances[0].sub(startingBalances[0]),
                "Aloe received 3 wei"
            ).to.equal(percentages[0].div(10));
            const aloeBalance = await paymentHandler.accumulatedBalance(recipients[0]);
            const aloeChange = await paymentHandler.accumulatedChange(recipients[0]);
            expect(
                aloeChange,
                "Aloe is eligible for 0/100 change"
            ).to.equal(BigNumber.from(0));

            expect(
                endingBalances[1].sub(startingBalances[1]),
                "Bill received 1 wei"
            ).to.equal(percentages[1].div(10));
            const billBalance = await paymentHandler.accumulatedBalance(recipients[1]);
            const billChange = await paymentHandler.accumulatedChange(recipients[1]);
            expect(
                billChange,
                "Bill is eligible for 0/100 change"
            ).to.equal(BigNumber.from(0));

            expect(
                endingBalances[2].sub(startingBalances[2]),
                "Cate has not yet received wei"
            ).to.equal(BigNumber.from(0));
            const cateBalance = await paymentHandler.accumulatedBalance(recipients[2]);
            const cateChange = await paymentHandler.accumulatedChange(recipients[2]);
            expect(
                cateChange,
                "Cate is eligible for 60/100 change"
            ).to.equal(BigNumber.from(60));

            expect(
                endingBalances[3].sub(startingBalances[3]),
                "Dane received 5 wei"
            ).to.equal(BigNumber.from(5));
            const daneBalance = await paymentHandler.accumulatedBalance(recipients[3]);
            const daneChange = await paymentHandler.accumulatedChange(recipients[3]);
            expect(
                daneChange,
                "Dane is eligible for 40/100 change"
            ).to.equal(BigNumber.from(40));

            expect(
                await ethers.provider.getBalance(paymentHandler.address),
                "paymentHandler holds balance for change"
            ).to.equal(
                aloeChange.add(
                    billChange.add(cateChange.add(daneChange))
                ).div(100).add(
                    aloeBalance.add(billBalance.add(cateBalance.add(daneBalance)))
                )
            );
        });
        it("increases balance when enough change is accumulated", async () => {
            const cateAddress = recipients[2];

            const cateBalance1 = await ethers.provider.getBalance(cateAddress);
            const contractBalance1 = await ethers.provider.getBalance(paymentHandler.address);

            let tx = await contract.deposit(safeMode, {value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance2 = await ethers.provider.getBalance(cateAddress);
            const contractBalance2 = await ethers.provider.getBalance(paymentHandler.address);

            expect(
                await paymentHandler.accumulatedBalance(cateAddress),
                "Cate does not accumulate a balance upon the first deposit"
            ).to.equal(BigNumber.from(0));
            expect(
                await paymentHandler.accumulatedChange(cateAddress),
                "Cate's accumulated change is set"
            ).to.equal(percentages[2].mul(10));
            expect(
                contractBalance2.sub(contractBalance1),
                "The paymentHandler stores the total value to later be divided amongst recipients"
            ).to.equal(BigNumber.from(10));

            tx = await contract.deposit(safeMode, {value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance3 = await ethers.provider.getBalance(cateAddress);
            const contractBalance3 = await ethers.provider.getBalance(paymentHandler.address);

            expect(
                await paymentHandler.accumulatedBalance(cateAddress),
                "The change over 100 gets added to Cate's balance"
            ).to.equal(BigNumber.from(1));
            expect(
                contractBalance3.sub(contractBalance2),
                "Because Cate does not receive the payment the contract balance does not change"
            ).to.equal(BigNumber.from(10));

            expect(
                await paymentHandler.accumulatedChange(cateAddress),
                "Cate still has some change remaining"
            ).to.equal(BigNumber.from(20));
        });
    });

    describe("deposit without safe mode after safe mode deposit", () => {
        it("sends accumulated balance and holds change", async () => {
            const cateAddress = recipients[2];

            const cateBalance1 = await ethers.provider.getBalance(cateAddress);
            const contractBalance1 = await ethers.provider.getBalance(paymentHandler.address);

            let tx = await contract.deposit(1, {value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance2 = await paymentHandler.accumulatedBalance(cateAddress);
            const contractBalance2 = await ethers.provider.getBalance(paymentHandler.address);

            expect(
                await paymentHandler.accumulatedBalance(cateAddress),
                "Cate does not accumulate a balance upon the first deposit"
            ).to.equal(BigNumber.from(0));
            expect(
                await paymentHandler.accumulatedChange(cateAddress),
                "Cate's accumulated change is set"
            ).to.equal(percentages[2].mul(10));
            expect(
                contractBalance2.sub(contractBalance1),
                "The paymentHandler stores the total value to later be divided amongst recipients"
            ).to.equal(BigNumber.from(10));

            tx = await contract.deposit(0, {value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance3 = await ethers.provider.getBalance(cateAddress);
            const contractBalance3 = await ethers.provider.getBalance(paymentHandler.address);

            let endingChange = await Promise.all(recipients.map((recipient) => {
                return paymentHandler.accumulatedChange(recipient);
            }));
            let endingChangeSum = endingChange.reduce((prev, curr) => {
                return prev.add(curr)
            });

            expect(
                cateBalance3.sub(cateBalance1),
                "The change over 100 and previous balance gets transferred to Cate"
            ).to.equal(BigNumber.from(1).add(cateBalance2));
            expect(
                contractBalance3,
                "Because Cate receives the payment the paymentHandler balance is the sum of the change"
            ).to.equal(endingChangeSum.div(100));

            expect(
                await paymentHandler.accumulatedChange(cateAddress),
                "Cate still has some change remaining"
            ).to.equal(BigNumber.from(20));
        });
    });

    describe("withdraw after safe mode deposit", () => {
        it("sends accumulated balance and holds change", async () => {
            const cateAddress = recipients[2];

            const cateBalance1 = await ethers.provider.getBalance(cateAddress);
            const contractBalance1 = await ethers.provider.getBalance(paymentHandler.address);

            let tx = await contract.deposit(1, {value: BigNumber.from(10)});
            await tx.wait();

            const cateBalance2 = await paymentHandler.accumulatedBalance(cateAddress);
            const contractBalance2 = await ethers.provider.getBalance(paymentHandler.address);

            expect(
                await paymentHandler.accumulatedBalance(cateAddress),
                "Cate does not accumulate a balance upon the first deposit"
            ).to.equal(BigNumber.from(0));
            expect(
                await paymentHandler.accumulatedChange(cateAddress),
                "Cate's accumulated change is set"
            ).to.equal(percentages[2].mul(10));
            expect(
                contractBalance2.sub(contractBalance1),
                "The paymentHandler stores the total value to later be divided amongst recipients"
            ).to.equal(BigNumber.from(10));

            tx = await contract.deposit(1, {value: BigNumber.from(10)});
            await tx.wait();
            tx = await paymentHandler.withdraw(cateAddress);
            await tx.wait();

            const cateBalance3 = await ethers.provider.getBalance(cateAddress);
            const contractBalance3 = await ethers.provider.getBalance(paymentHandler.address);

            let endingBalances = await Promise.all(recipients.map((recipient) => {
                return paymentHandler.accumulatedBalance(recipient);
            }));
            let endingBalancesSum = endingBalances.reduce((prev, curr) => {
                return prev.add(curr)
            });
            let endingChange = await Promise.all(recipients.map((recipient) => {
                return paymentHandler.accumulatedChange(recipient);
            }));
            let endingChangeSum = endingChange.reduce((prev, curr) => {
                return prev.add(curr)
            });

            expect(
                cateBalance3.sub(cateBalance1),
                "The change over 100 and previous balance gets transferred to Cate"
            ).to.equal(BigNumber.from(1).add(cateBalance2));
            expect(
                contractBalance3,
                "The paymentHandler balance is the sum of the change and remaining balances"
            ).to.equal(endingChangeSum.div(100).add(endingBalancesSum));

            expect(
                await paymentHandler.accumulatedChange(cateAddress),
                "Cate still has some change remaining"
            ).to.equal(BigNumber.from(20));
        });
    });
});
