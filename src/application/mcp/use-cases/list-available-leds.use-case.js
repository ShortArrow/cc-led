export class ListAvailableLedsUseCase {
  #ledController;
  #ledMapping;

  constructor(ledController, ledMapping) {
    this.#ledController = ledController;
    this.#ledMapping = ledMapping;
  }

  async execute() {
    const mappings = await this.#ledMapping.getAllMappings();
    
    const ledList = await Promise.all(
      mappings.map(async (mapping) => {
        try {
          const status = await this.#ledController.getLedStatus(mapping.ledNumber);
          return {
            ledNumber: mapping.ledNumber,
            name: mapping.name,
            state: status
          };
        } catch (error) {
          return {
            ledNumber: mapping.ledNumber,
            name: mapping.name,
            state: {
              status: 'unknown',
              color: null,
              brightness: 0
            }
          };
        }
      })
    );

    return ledList;
  }
}