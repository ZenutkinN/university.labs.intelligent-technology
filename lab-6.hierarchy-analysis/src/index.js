import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class HierarchyAnalysis extends React.Component {
    constructor() {
        super();
        this.RCI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
        this.resultTable = null;
        this.state = {
            criteriasNumber: '',
            analoguesNumber: '',
            isStartButtinPress: false,
            criterias: {
                label: 'c',
                labels: null,
                matrix: null,
            },
            currentAnalogue: 0,
            analogues: [],
            calcCriterias: null,
            currentCalcAnalogue: 0,
            calcAnalogues: null,
        };

        this.startInputHandler = this.startInputHandler.bind(this);
        this.startButtonHandler = this.startButtonHandler.bind(this);
        this.prepareMatrix = this.prepareMatrix.bind(this);
        this.prepareAnalogues = this.prepareAnalogues.bind(this);
        this.handleCurrentMatrix = this.handleCurrentMatrix.bind(this);
        this.matrixInputHandle = this.matrixInputHandle.bind(this);
        this.putValueInMatrix = this.putValueInMatrix.bind(this);
        this.createCalcMatrix = this.createCalcMatrix.bind(this);
        this.checkConsistencyRelation = this.checkConsistencyRelation.bind(this);
        this.checkGeneralizedRelationshipConsistency = this.checkGeneralizedRelationshipConsistency.bind(this);
    };

    startInputHandler(name, event) {
        this.setState({[name]: +event.target.value});
    };

    startButtonHandler() {
        this.prepareMatrix();
        this.setState({isStartButtinPress: !this.state.isStartButtinPress});
    };

    prepareMatrix() {
        let newCriterias = JSON.parse(JSON.stringify(this.state.criterias));
        newCriterias.matrix = this.createMatrix(this.state.criteriasNumber);
        newCriterias.labels = this.createLabels(newCriterias.label, this.state.criteriasNumber);
        this.prepareAnalogues(newCriterias.labels);

        this.setState({criterias: newCriterias});  
    };

    prepareAnalogues(arrCriteriasLabel) {
        let newAnalogues = JSON.parse(JSON.stringify(this.state.analogues));
        arrCriteriasLabel.forEach((label) => {
            let objAnalogue = {};
            objAnalogue['criteriaLabel'] = label;
            objAnalogue['labels'] = this.createLabels('a', this.state.analoguesNumber);
            objAnalogue['matrix'] = this.createMatrix(this.state.analoguesNumber);
            newAnalogues.push(objAnalogue);
        });

        this.setState({analogues: newAnalogues});
    };

    createMatrix(rank) {
        let newMatrix = [];

        for (let i = 0; i < rank; i++) {
            let row = [];

            for (let j = 0; j < rank; j++) {
                if (i === j) {
                    row.push(1);
                } else {
                    row.push('');
                };
            };
            
            newMatrix.push({rowMatrix: row});
        };

        return newMatrix;
    };

    createLabels(label, rank) {
        let labels = [];
        for (let i = 1; i <= rank; i++) {
            labels.push(label + i)
        };

        return labels;
    };

    handleCurrentMatrix(num, name) {
        let newCurrentAnalogue = this.state[name];

        if (newCurrentAnalogue === 0 && num === -1) {
            newCurrentAnalogue = 0;
        } else if (newCurrentAnalogue === (this.state.criteriasNumber - 1) && num === +1) {
            newCurrentAnalogue = this.state.criteriasNumber - 1;
        } else {
            newCurrentAnalogue += num;
        };

        this.setState({[name]: newCurrentAnalogue});
    };

    matrixInputHandle(indexRow, indexCol, parametrName, event) {
        let parametr = JSON.parse(JSON.stringify(this.state[parametrName]));

        if (parametrName === 'criterias') {
            let matrix = parametr.matrix;
            parametr.matrix = this.putValueInMatrix(matrix, event.target.value, indexRow, indexCol);
        } else {
            let matrix = parametr[this.state.currentAnalogue].matrix;
            this.putValueInMatrix(matrix, event.target.value, indexRow, indexCol);
        };

        this.setState({[parametrName]: parametr});
    };

    putValueInMatrix(matrix, value, indexRow, indexCol) {
        matrix[indexRow].rowMatrix[indexCol] = value;
        if (value.match(/\//)) {
            let digit = value.split('/')[1];
            matrix[indexCol].rowMatrix[indexRow] = digit;
        } else {
            matrix[indexCol].rowMatrix[indexRow] = '1/' + value;
        };

        return matrix;
    };

    createCalcMatrix() {
        let newCriterias = JSON.parse(JSON.stringify(this.state.criterias));
        let newAnalogues = JSON.parse(JSON.stringify(this.state.analogues));

        this.calculateMatrix(newCriterias);
        newAnalogues.forEach(analogue => this.calculateMatrix(analogue));

        this.resultTable = this.createResultTable(newCriterias, newAnalogues);
        this.setState({
            calcCriterias: newCriterias,
            calcAnalogues: newAnalogues,
        });
    };

    calculateMatrix(parametr) {
        this.calcGeometricAverageRow(parametr);
        this.calcSumGeometricAverageRow(parametr);
        this.calcNormalizedPriorityVector(parametr);
        this.calcSumColumn(parametr);
        this.calcEigenvalueMatrix(parametr);
        this.calcReconciliationIndex(parametr);
        this.calcConsistencyRelation(parametr);
    };

    calcGeometricAverageRow(parametr) {
        let {matrix} = parametr;
        const matrixRank = matrix[0].rowMatrix.length;
        matrix.forEach(row => {
            let rowProduct = row.rowMatrix.reduce((product, cell) => product * eval(cell), 1);
            row['geomAverage'] =  this.numberNormalization(Math.pow(rowProduct, 1 / matrixRank));
        });
    };

    calcSumColumn(parametr) {
        let matrix = parametr.matrix;
        let matrixRank = matrix.length;
        let arrSumCol = [];
        
        for (let i = 0; i < matrixRank; i++) {
            let sum = 0;
            for (let j = 0; j < matrixRank; j++) {
                sum += eval(matrix[j].rowMatrix[i]);
            };

            arrSumCol.push(this.numberNormalization(sum));
        };

        parametr['sumCol'] = arrSumCol; 
    };

    calcSumGeometricAverageRow(parametr) {
        const number = parametr.matrix.reduce((sum, row) => sum + row.geomAverage, 0);
        parametr['sumGeomAverage'] = this.numberNormalization(number);
    };

    calcNormalizedPriorityVector(parametr) {
        let {matrix, sumGeomAverage} = parametr;
        matrix.forEach(row => {
            row['NPV'] =  this.numberNormalization(row.geomAverage / sumGeomAverage);
        });
    };

    calcEigenvalueMatrix(parametr) {
        let matrix = parametr.matrix;
        let EVM = parametr.sumCol.reduce((sum, sumCol, index) => sum + (sumCol * matrix[index].NPV), 0);
        
        parametr['EVM'] = this.numberNormalization(EVM);
    };

    calcReconciliationIndex(parametr) {
        let rankMatrix =  parametr.matrix[0].rowMatrix.length;
        parametr['RI'] = this.numberNormalization((parametr.EVM - rankMatrix) / (rankMatrix - 1));
    };

    calcConsistencyRelation(parametr) {
        let rankMatrix =  parametr.matrix[0].rowMatrix.length;
        parametr['CR'] = this.numberNormalization(parametr.RI / this.RCI[rankMatrix - 1]);
    };

    createResultTable(calcCriterias, calcAnalogues) {
        let resultTable = {};
        resultTable['zeroCol'] = calcCriterias.labels;
        resultTable['zeroRow'] = calcAnalogues[0].labels;
        resultTable['NPV'] = calcCriterias.matrix.map(row => row.NPV);
        resultTable['RI'] = calcAnalogues.map(analogue => analogue.RI);

        let matrix = [];
        for (let i = 0; i < this.state.analoguesNumber; i++) {
            matrix.push({rowMatrix: []})
        };
        resultTable['matrix'] = matrix;

        calcAnalogues.forEach(analogue => {
            analogue.matrix.forEach((row, index) => {
                resultTable.matrix[index].rowMatrix.push(row.NPV);
            });
        });

        this.calcOverallPriority(resultTable);
        this.calcGeneralizedHarmonizationIndex(resultTable);
        this.calcGeneralizedRelationshipConsistency(resultTable);
        
       return resultTable;
    };

    calcOverallPriority(parametr) {
        let {matrix, NPV} = parametr;
        matrix.forEach(row => {
            let OP = row.rowMatrix.reduce((sum, cell, index) => sum + (cell * NPV[index]), 0);
            row['OP'] = this.numberNormalization(OP);
        });
    };

    calcGeneralizedHarmonizationIndex(parametr) {
        let GHI = parametr.RI.reduce((sum, RI, index) => sum + (RI * parametr.NPV[index]), 0);
        
        parametr['GHI'] = this.numberNormalization(GHI);
    };

    calcGeneralizedRelationshipConsistency(parametr) {
        let rankMatrix =  parametr.matrix[0].rowMatrix.length;
        parametr['GCR'] = this.numberNormalization(parametr.GHI / this.RCI[rankMatrix - 1]);
    };

    numberNormalization(number) {
        return Number((number).toFixed(2))
    };

    getBestVariant() {
       let arrOP = this.resultTable.matrix.map(row => row.OP);
       return this.resultTable.zeroRow[arrOP.indexOf(Math.max(...arrOP))];
    };

    checkConsistencyRelation() {
        return this.state.calcCriterias.CR <= 0.15;
    };

    checkGeneralizedRelationshipConsistency() {
        return this.resultTable.GCR <= 0.15;
    };

    render() {
        let bestVariant = '';
        let calcMatrixSection = '';
        let resultTable = '';
    
        if (this.resultTable != null && this.checkConsistencyRelation()) {
            if (this.checkGeneralizedRelationshipConsistency()) {
                bestVariant = this.getBestVariant();
            
                calcMatrixSection = <CalcMatrixSection
                    calcCriterias = {this.state.calcCriterias}
                    calcAnalogues = {this.state.calcAnalogues[this.state.currentCalcAnalogue]}
                    handleCurrentMatrix = {this.handleCurrentMatrix}
                />
                resultTable = <ResultTable
                    resultTable = {this.resultTable}
                />
            } else {
                bestVariant = 'Общие отношение согласованность больше 15%. Пересчитайте матрицы вариантов.';
            };
        } else if (this.resultTable != null){
            bestVariant = 'Отношение согласованность больше 15%. Пересчитайте матрицу критериев.';
        };

        return  <div>
            <StartWindow 
                criteriasNumber = {this.state.criteriasNumber}
                analoguesNumber = {this.state.analoguesNumber}
                isStartButtinPress = {this.state.isStartButtinPress}
                startInputHandler = {this.startInputHandler}
                startButtonHandler = {this.startButtonHandler}
            />
            {this.state.isStartButtinPress ? 
            <MatrixSection 
                criterias = {this.state.criterias}
                analogues = {this.state.analogues[this.state.currentAnalogue]}
                matrixInputHandle = {this.matrixInputHandle}
                handleCurrentMatrix = {this.handleCurrentMatrix}
                createCalcMatrix = {this.createCalcMatrix}
                bestVariant = {bestVariant}
            /> : ''} 
            {calcMatrixSection}
            {resultTable}
        </div>
    };
};

function StartWindow(props) {
    return <section id='startSection' className={props.isStartButtinPress ? 'hide' : ''}>
        <div>
            <p>Введите количество критериев оценки</p>
            <input 
                type="text"
                value={props.criteriasNumber}
                onChange={props.startInputHandler.bind(null, 'criteriasNumber')}
            /> 
            <p>Введите количество аналогов</p>
            <input 
                type="text"
                value={props.analoguesNumber}
                onChange={props.startInputHandler.bind(null, 'analoguesNumber')}
            />
            <button onClick={props.startButtonHandler}>
                Создать матрицы
            </button>
        </div>
    </section>;
};

function MatrixSection (props) {
        return <section id="matrixSection">
            <div className="matrixArea">
                <p>Заполните матрицу <br/> ранжирование критериев</p>
                <Matrix 
                    parametr = {props.criterias}
                    criteriaLabel = {''}
                    matrixName = {'criterias'}
                    matrixInputHandle = {props.matrixInputHandle}
                />
            </div>
            <div className="matrixArea">
                <p>Заполните матрицы <br/> ранжирование аналогов</p>
                <CurrentAnalogue 
                    handleCurrentMatrix = {props.handleCurrentMatrix}
                />
                <Matrix 
                    parametr = {props.analogues}
                    criteriaLabel = {props.analogues.criteriaLabel}
                    matrixName = {'analogues'}
                    matrixInputHandle = {props.matrixInputHandle}
                />
            </div>
            <CalcSection 
                createCalcMatrix={props.createCalcMatrix}
                bestVariant = {props.bestVariant}
            />
    </section>
};

function CalcSection (props) {
    return <section id="calcSection">
        <div>
            <button onClick={props.createCalcMatrix}>
                Рассчитать
            </button>
        </div>
        <p>
            Лучший вариант: {props.bestVariant}
        </p>
    </section>
};

function CurrentAnalogue(props) {
    return <div className='currentMatrix'>
        <div onClick={props.handleCurrentMatrix.bind(null, -1, 'currentAnalogue')}>
            &#8249;
        </div>
        <div onClick={props.handleCurrentMatrix.bind(null, +1, 'currentAnalogue')}>
            &#8250;
        </div>
    </div>
};

class Matrix extends React.Component {
    constructor() {
        super();

        this.createZeroCells = this.createZeroCells.bind(this);
        this.createRows = this.createRows.bind(this);
    };

    createZeroCells(labels) {
        return labels.map((label, index) => {
            return <td key={index}>
                {label}
            </td>;
        });
    };

    createRows(matrix) {
        return matrix.map((row, indexRow) => {
            let labels = this.props.parametr.labels;
            return <tr key={indexRow}>
                <td>{labels[indexRow]}</td>
                {this.createCell(row.rowMatrix, indexRow)}
            </tr>
        });
    };

    createCell(arrayCells, indexRow) {
        return arrayCells.map((cell, indexColl, array) => {
            return <td key={indexColl}>
                {(indexColl > indexRow && indexColl <= array.length) 
                    ? <input 
                        type="text"
                        value={cell}
                        onChange={this.props.matrixInputHandle.bind(null, indexRow, indexColl, this.props.matrixName)}
                    /> 
                    : cell
                }</td>
        });
    };
    
    render() {
        return <table>
            <tbody>
                <tr>
                    <td>{this.props.criteriaLabel}</td>
                    {this.createZeroCells(this.props.parametr.labels)}
                </tr>
                {this.createRows(this.props.parametr.matrix)}
            </tbody>
        </table>
    };
};

function CalcMatrixSection(props) {
    return <section id="calcMatrixSection">
        <div className="calcMatrixArea">
            <p>Таблица расчета критериев</p>
            <CalcMatrix 
                parametr = {props.calcCriterias}
                criteriaLabel = {''}
            />
        </div>
        <div className="calcMatrixArea">
            <p>Таблица расчета аналогов</p>
            <CurrentCalcAnalogue 
                handleCurrentMatrix = {props.handleCurrentMatrix}
            />
            <CalcMatrix 
                parametr = {props.calcAnalogues}
                criteriaLabel = {props.calcAnalogues.criteriaLabel}
            />
        </div>
    </section>
};

function CurrentCalcAnalogue(props) {
    return <div className='currentMatrix'>
        <div onClick={props.handleCurrentMatrix.bind(null, -1, 'currentCalcAnalogue')}>
            &#8249;
        </div>
        <div onClick={props.handleCurrentMatrix.bind(null, +1, 'currentCalcAnalogue')}>
            &#8250;
        </div>
    </div>
};

class CalcMatrix extends React.Component {
    constructor() {
        super();

        this.createZeroCells = this.createZeroCells.bind(this);
        this.createRows = this.createRows.bind(this);
    };

    createZeroCells(labels) {
        return labels.map((label, index) => {
            return <td key={index}>
                {label}
            </td>;
        });
    };

    createRows(matrix, labels) {
        return matrix.map((row, indexRow) => {
            return <tr key={indexRow}>
                <td>{labels[indexRow]}</td>
                {this.createCell(row.rowMatrix)}
                <td>{matrix[indexRow].geomAverage}</td>
                <td>{matrix[indexRow].NPV}</td>
            </tr>
        });
    };

    createCell(arrayCells) {
        return arrayCells.map((cell, indexColl) => {
            return <td key={indexColl}>
                {cell}
            </td>
        });
    };
    
    render() {
        return <table>
            <tbody>
                <tr>
                    <td>{this.props.criteriaLabel}</td>
                    {this.createZeroCells(this.props.parametr.labels)}
                    <td>Среднее <br/> геометрическое</td>
                    <td>НВП</td>
                </tr>
                {this.createRows(this.props.parametr.matrix, this.props.parametr.labels)}
                <tr>
                    <td>sum</td>
                    {this.createCell(this.props.parametr.sumCol)}
                </tr>
                <tr>
                    <td>&#955;</td>
                    <td>{this.props.parametr.EVM}</td>
                </tr>
                <tr>
                    <td>ИС</td>
                    <td>{this.props.parametr.RI}</td>
                </tr>
                <tr>
                    <td>ОС</td>
                    <td>{this.props.parametr.CR}</td>
                </tr>
            </tbody>
        </table>
    };
};

function ResultTable(props) {
    return <section id="resultTableSection">
        <div className="resultTableArea">
            <p>Результаты расчета</p>
            <ResultMatrix 
                parametr = {props.resultTable}
            />
        </div>
    </section>
};

class ResultMatrix extends React.Component {
    constructor() {
        super();

        this.createRows = this.createRows.bind(this);
    };

    createRows(matrix, labels) {
        return matrix.map((row, indexRow) => {
            return <tr key={indexRow}>
                <td>{labels[indexRow]}</td>
                {this.createCell(row.rowMatrix)}
                <td>{matrix[indexRow].OP}</td>
            </tr>
        });
    };

    createCell(arrayCells) {
        return arrayCells.map((cell, indexColl) => {
            return <td key={indexColl}>
                {cell}
            </td>
        });
    };
    
    render() {
        return <table>
            <tbody>
                <tr>
                    <td rowSpan="2">НВП по<br/>критериям</td>
                    {this.createCell(this.props.parametr.zeroCol)}
                    <td rowSpan="2">Итоговые<br/>значения<br/>приориетов</td>
                </tr>
                <tr>
                    {this.createCell(this.props.parametr.NPV)}
                </tr>
                {this.createRows(this.props.parametr.matrix, this.props.parametr.zeroRow)}
                <tr>
                    <td>ОИС</td>
                    <td>{this.props.parametr.GHI}</td>
                </tr>
                <tr>
                    <td>ООС</td>
                    <td>{this.props.parametr.GCR}</td>
                </tr>
            </tbody>
        </table>
    };
};

ReactDOM.render(
    <HierarchyAnalysis />,
    document.getElementById('root')
);