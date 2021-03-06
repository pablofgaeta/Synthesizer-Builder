

let SynthBuilder = {
    Synths : [],
    __activeSynthIndex : function() {
        for (let i = 0; i < this.Synths.length; ++i) {
            if (this.Synths[i].active) return i;
        }
        return -1;
    },
    active : function() {
        let index = this.__activeSynthIndex();
        return index != -1 ? this.Synths[index] : null;
    },
    create : function(card_container, editor_container) {
        let synth_controller = new SynthController(card_container, editor_container);
        this.Synths.push(synth_controller);
        synth_controller.open();
    },
    delete : function(synth_controller) {
        synth_controller.close();
    
        let removeIndex = this.Synths.indexOf(synth_controller);
        let activeIndex = this.__activeSynthIndex();
        this.Synths.splice(removeIndex, 1);

        // If removing active synth, choose next lowest synth
        if (removeIndex == activeIndex && this.Synths.length > 0) {
            this.Synths[activeIndex == 0 ? 0 : activeIndex - 1].open();
        }
    }
};

class SynthController {
    constructor(card_container, editor_container, id = generateName()) {
        this.id = id;
        this.active = true;
        this.synth = new ETSynth();

        this.card = new SynthCard(card_container, this);
        this.editor = new SynthEditor(editor_container, this);

        this.editor.title.oninput = () => { this.updateCard() };
        this.card.body.onclick = () => { this.open() };
        this.card.container.onmouseover = () => {
            if (!this.active)
                this.card.body.style.backgroundColor = Styles.synth_cardFG + '80';
        };
        this.card.container.onmouseleave   = () => {
            if (!this.active)
                this.card.body.style.backgroundColor = Styles.synth_cardBG;
        }
        this.card.exit.onmouseup = () => SynthBuilder.delete(this);
    }

    close() {
        this.card.container.remove();
        this.editor.container.remove();
    }

    open() {
        for (let synth_controller of SynthBuilder.Synths) {
            synth_controller.active = synth_controller.card.body.innerHTML == this.card.body.innerHTML;
            if (!synth_controller.active) synth_controller.synth.releaseAll();
            synth_controller.editor.container.style.display = synth_controller.active ? 'flex' : 'none';
            synth_controller.card.body.style.backgroundColor = synth_controller.active ? Styles.synth_cardFG : Styles.synth_cardBG;
        }
        return this;
    }

    updateCard() {
        this.id = this.card.body.innerHTML = this.editor.title.innerHTML;
    }
}

function SynthCard(card_container, synth_controller) {
    this.container = document.createElement('div');
    this.container.className = 'relative';

    this.body = document.createElement('button');
    this.body.className = 'button-l synth-card white'
    this.body.style.backgroundColor = Styles.synth_cardFG;
    this.body.innerHTML = synth_controller.id;

    this.exit = document.createElement('img');
    this.exit.className = 'exit';
    this.exit.src = 'exit.png';

    this.container.appendChild(this.body);
    this.container.appendChild(this.exit);

    card_container.appendChild(this.container);
}

function SynthEditor(editor_container, synth_controller) {
    this.container = document.createElement('div');
    this.container.className = 'flex-container-center synth-editor';

    this.title = document.createElement('div');
    this.title.className = 'txt-m synth-title gray editable';
    this.title.contentEditable = 'true';
    this.title.innerHTML = synth_controller.id;
    this.title.onkeydown = (event) => {
        if (['Return', 'Enter'].includes(event.key)) event.preventDefault();
    }

    let horizontal = document.createElement('div');
    horizontal.className = 'rule';

    this.frequencies = new FrequenciesController(synth_controller.synth);

    this.base_input = InputField (
        'Base Frequency', 
        '440 hz', 
        [/^[a-gA-G][0-9]+$/, /^[0-9]+\s*(hz)?$/], // Sci Pitch and Hertz Notation
        (value) => {
            let frequency;
            if (/^[a-gA-G][0-9]+$/.test(value)) {
                frequency = new Tone.Frequency(value);
            }
            else if (/^[0-9]+\s*(hz)?$/.test(value)) {
                frequency = parseFloat(value);
            }
            synth_controller.synth.set_base(frequency);
            this.frequencies.updateDisplay();
        },
        'Update',
        (value) => alert('Invalid input: ' + value)
    );

    this.multiplier_input = InputField (
        'Number of divisions',
        '12',
        [/^\d+$/],
        (value) => {
            let int_val = parseInt(value);
            synth_controller.synth.set_divisions(int_val);
            this.frequencies.updateDisplay();
        },
        'Update',
        (value) => alert('Invalid input: ' + value)
    );

    this.container.appendChild(this.title);
    this.container.appendChild(horizontal);
    this.container.appendChild(this.base_input);
    this.container.appendChild(this.multiplier_input);
    this.container.appendChild(this.frequencies.container);

    editor_container.appendChild(this.container);
}

function FrequenciesController(synth) {
    this.container = document.createElement('div');
    this.container.className = 'flex-container-center';
    this.container.style.width = '100%';

    this.title = document.createElement('div');
    this.title.className = 'txt-m gray';
    this.title.innerHTML = 'Frequencies';
    this.title.style.width = '100%';
    this.container.appendChild(this.title);

    this.pad_container = document.createElement('div');
    this.pad_container.className = 'flex-container-center pad-container';
    this.pad_container.style.width = '100%';
    this.container.appendChild(this.pad_container);

    this.updateDisplay = () => {
        this.pad_container.innerHTML = '';
        for (let i = 0; i < ETSynth.keys.length; ++i) {
            let relative_octave = Math.pow(2, Math.floor(i / synth.notes.length));
            let note = synth.notes[i % synth.notes.length] * relative_octave;
            let key = ETSynth.keys[i];

            let pad           = document.createElement('button');
            pad.className   = 'button-l frequency-pad white txt-s flex-container-center';
            pad.ontouchstart = (event) => {
                event.preventDefault();
                synth.__attack_by_hertz(note);
            }
            pad.ontouchend = (event) => {
                event.preventDefault();
                synth.__release_by_hertz(note);
            }
            pad.onmousedown = () => synth.__attack_by_hertz(note);
            pad.onmouseup   = () => synth.__release_by_hertz(note);

            let mapping       = document.createElement('div');
            mapping.className = 'txt-m frequency-mapping';
            mapping.innerHTML = key;

            let value = document.createElement('div');
            value.className   = 'white txt-s';
            value.innerHTML   = note.toFixed(2) + ' hz';

            pad.appendChild(mapping);
            pad.appendChild(value);
            this.pad_container.appendChild(pad);
        }
    }

    this.updateDisplay();
}